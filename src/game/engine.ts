import {
  GameState,
  PlayerState,
  Enemy,
  EnemyType,
  Platform,
  SaberPickup,
  Projectile,
  Particle,
  DamageNumber,
  GameStats,
  SlashType,
  SlicedPart,
  GraphicQuality,
  DifficultyMode,
} from '../types/game';
import {
  GRAVITY,
  MOVE_SPEED,
  SPRINT_SPEED,
  JUMP_FORCE,
  DOUBLE_JUMP_FORCE,
  AIR_DRAG,
  GROUND_FRICTION,
  COMBO_MOVES,
  COMBO_TIMEOUT,
  ENERGY_MAX,
  SABER_MAX_TIME,
  SABER_PICKUP_TIME,
  DIFFICULTY_CONFIGS,
} from './constants';
import { GameRenderer } from './renderer';
import { sound } from '../audio/soundEngine';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: GameRenderer;

  public state: GameState = 'TITLE';
  public quality: GraphicQuality = 'AUTO';
  public difficulty: DifficultyMode = 'NORMAL';
  public isLowQualityActive: boolean = false;
  private fpsHistory: number[] = [];
  private lastFpsCheckTime: number = 0;
  public currentFps: number = 60;

  public player: PlayerState;
  public enemies: Enemy[] = [];
  public platforms: Platform[] = [];
  public pickups: SaberPickup[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public damageNumbers: DamageNumber[] = [];
  public stats: GameStats;

  public saberColor: string = 'cyan';
  public activeBoss: Enemy | null = null;

  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;

  // Input states
  private heldKeys: Set<string> = new Set();
  private justPressedKeys: Set<string> = new Set();
  private keyPressTimestamps: Map<string, number> = new Map();

  // Callbacks
  public onStatsChange?: (stats: GameStats, player: PlayerState, boss: Enemy | null) => void;
  public onStateChange?: (state: GameState) => void;
  public onQualityAdjusted?: (isAutoLow: boolean) => void;

  // Procedural Level Generation
  private nextSpawnX: number = 0;
  private sectorBossSpawned: boolean = false;
  private lastBossMilestone: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.renderer = new GameRenderer(ctx);

    this.player = this.createDefaultPlayer();
    this.stats = this.createDefaultStats();

    this.setupInputs();
  }

  private createDefaultPlayer(): PlayerState {
    return {
      x: 100,
      y: 200,
      vx: 0,
      vy: 0,
      width: 26,
      height: 48,
      isGrounded: false,
      canDoubleJump: true,
      facingRight: true,
      health: 100,
      maxHealth: 100,
      energy: 30,
      saberActive: true,
      saberTimer: 15.0, // Start with 15s starter saber
      currentSlash: null,
      slashProgress: 0,
      slashDuration: 0,
      invulnerableTimer: 0,
      animFrame: 0,
      isRunning: false,
      isSliding: false,
      afterimages: [],
    };
  }

  private createDefaultStats(): GameStats {
    return {
      score: 0,
      combo: 0,
      maxCombo: 0,
      comboMultiplier: 1.0,
      comboTimer: 0,
      distance: 0,
      enemiesKilled: 0,
      bossesDefeated: 0,
      saberPickupsCollected: 0,
      saberTotalActiveSeconds: 0,
      ultimatesUsed: 0,
      stage: 1,
    };
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.renderer.setSize(width, height);
  }

  public setSaberColor(color: string) {
    this.saberColor = color;
  }

  public setGraphicQuality(q: GraphicQuality) {
    this.quality = q;
    if (q === 'LOW') {
      this.isLowQualityActive = true;
    } else if (q === 'HIGH') {
      this.isLowQualityActive = false;
    }
  }

  public setDifficulty(mode: DifficultyMode) {
    this.difficulty = mode;
    const diffCfg = DIFFICULTY_CONFIGS[mode] || DIFFICULTY_CONFIGS.NORMAL;
    if (diffCfg.isInfinite && this.player) {
      this.player.saberActive = true;
      this.player.saberTimer = 999;
    }
  }

  // --- INITIALIZE & START GAME ---

  public startGame() {
    this.player = this.createDefaultPlayer();
    const diffCfg = DIFFICULTY_CONFIGS[this.difficulty] || DIFFICULTY_CONFIGS.NORMAL;
    this.player.saberTimer = diffCfg.starterTimer;
    this.player.saberActive = true;

    this.stats = this.createDefaultStats();
    this.enemies = [];
    this.platforms = [];
    this.pickups = [];
    this.projectiles = [];
    this.particles = [];
    this.damageNumbers = [];
    this.activeBoss = null;
    this.sectorBossSpawned = false;
    this.lastBossMilestone = 0;
    this.nextSpawnX = 0;

    // Build initial starter runway
    this.buildInitialLevel();

    this.state = 'PLAYING';
    if (this.onStateChange) this.onStateChange('PLAYING');

    sound.startMusic();
    sound.startSaberHum();

    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      if (this.onStateChange) this.onStateChange('PAUSED');
      sound.stopSaberHum();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      if (this.onStateChange) this.onStateChange('PLAYING');
      if (this.player.saberActive) sound.startSaberHum();
      this.lastTime = performance.now();
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    sound.stopMusic();
    sound.stopSaberHum();
  }

  // --- LEVEL GENERATION ---

  private buildInitialLevel() {
    // Starting safe runway
    this.platforms.push({ x: -100, y: 380, width: 900, height: 160 });

    // Initial starter saber pickup
    this.pickups.push({
      id: 'pickup-init',
      x: 350,
      y: 330,
      width: 24,
      height: 36,
      collected: false,
      bobOffset: 0,
      bonusSeconds: SABER_PICKUP_TIME,
    });

    this.nextSpawnX = 850;
    // Generate up to 2500px forward
    this.generateChunksAhead(2500);
  }

  private generateChunksAhead(targetDistance: number) {
    while (this.nextSpawnX < this.player.x + targetDistance) {
      const gap = 80 + Math.random() * 90;
      const platW = 240 + Math.random() * 320;
      const platY = 320 + (Math.random() - 0.5) * 120;

      const platX = this.nextSpawnX + gap;
      this.platforms.push({
        x: platX,
        y: Math.max(220, Math.min(440, platY)),
        width: platW,
        height: 140,
      });

      // Maybe add high floating semi-solid platform above
      if (Math.random() > 0.4) {
        this.platforms.push({
          x: platX + 40,
          y: Math.max(140, platY - 95),
          width: 140,
          height: 18,
          isSemiSolid: true,
        });
      }

      // Add Lightsaber Pickups on platforms
      if (Math.random() > 0.35) {
        this.pickups.push({
          id: 'pickup-' + Math.random(),
          x: platX + platW * 0.5,
          y: platY - 45,
          width: 24,
          height: 36,
          collected: false,
          bobOffset: Math.random() * Math.PI,
          bonusSeconds: SABER_PICKUP_TIME,
        });
      }

      // Check if Boss should spawn (Every 600m)
      const currentDistanceMeters = Math.floor(this.player.x / 40);
      const isBossTime =
        currentDistanceMeters >= 500 &&
        currentDistanceMeters - this.lastBossMilestone >= 500 &&
        !this.activeBoss;

      if (isBossTime) {
        this.spawnBoss(platX + platW * 0.7, platY - 90);
        this.lastBossMilestone = currentDistanceMeters;
      } else {
        // Spawn standard enemies
        const numEnemies = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numEnemies; i++) {
          const enemyType: EnemyType =
            Math.random() < 0.35 ? 'DRONE' : Math.random() < 0.65 ? 'SHIELD' : 'ROGUE';
          this.spawnEnemy(enemyType, platX + 80 + i * 85, platY - 48);
        }
      }

      this.nextSpawnX = platX + platW;
    }

    // Garbage collection of far-behind platforms and enemies
    const cullBoundary = this.player.x - 1200;
    this.platforms = this.platforms.filter((p) => p.x + p.width > cullBoundary);
    this.pickups = this.pickups.filter((p) => p.x > cullBoundary);
    this.enemies = this.enemies.filter((e) => e.x > cullBoundary || e.type === 'BOSS');
  }

  private spawnEnemy(type: EnemyType, x: number, y: number) {
    const isDrone = type === 'DRONE';
    const isShield = type === 'SHIELD';

    this.enemies.push({
      id: 'enemy-' + Math.random(),
      type,
      name: isDrone ? 'Neon Drone' : isShield ? 'Shield Juggernaut' : 'Cyber Rogue',
      x,
      y: isDrone ? y - 60 : y,
      vx: 0,
      vy: 0,
      width: isDrone ? 32 : 28,
      height: isDrone ? 28 : 46,
      health: isShield ? 65 : isDrone ? 30 : 45,
      maxHealth: isShield ? 65 : isDrone ? 30 : 45,
      isGrounded: !isDrone,
      facingRight: false,
      attackCooldown: 120 + Math.random() * 100,
      state: 'PATROL',
      stunTimer: 0,
      telegraphTimer: 0,
      color: isDrone ? '#f59e0b' : isShield ? '#3b82f6' : '#ef4444',
      scoreValue: isShield ? 350 : isDrone ? 200 : 250,
    });
  }

  private spawnBoss(x: number, y: number) {
    sound.playBossAlert();
    this.renderer.triggerShake(18);

    const boss: Enemy = {
      id: 'boss-' + Date.now(),
      type: 'BOSS',
      name: this.stats.bossesDefeated === 0 ? 'CYBER TITAN OVERLORD' : 'NEON OMEGA EMPEROR',
      x,
      y,
      vx: 0,
      vy: 0,
      width: 58,
      height: 84,
      health: 800 + this.stats.bossesDefeated * 350,
      maxHealth: 800 + this.stats.bossesDefeated * 350,
      isGrounded: true,
      facingRight: false,
      attackCooldown: 100,
      state: 'CHASE',
      stunTimer: 0,
      telegraphTimer: 0,
      color: '#ef4444',
      scoreValue: 5000,
      bossPhase: 1,
      bossAttackPattern: 0,
    };

    this.enemies.push(boss);
    this.activeBoss = boss;
  }

  // --- INPUT SYSTEM ---

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      const key = e.key.toLowerCase();
      if (!this.heldKeys.has(key)) {
        this.justPressedKeys.add(key);
        this.keyPressTimestamps.set(key, performance.now());
      }
      this.heldKeys.add(key);

      if (e.code === 'Escape' || key === 'p') {
        this.pauseGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.heldKeys.delete(key);
      this.keyPressTimestamps.delete(key);
    });

    window.addEventListener('blur', () => {
      this.heldKeys.clear();
      this.justPressedKeys.clear();
      this.keyPressTimestamps.clear();
    });
  }

  // Public Touch Actions
  public triggerTouchJump() {
    this.justPressedKeys.add(' ');
    this.heldKeys.add(' ');
  }

  public releaseTouchJump() {
    this.heldKeys.delete(' ');
  }

  public triggerTouchSlash(type: 'C' | 'X' | 'Z') {
    const key = type.toLowerCase();
    this.justPressedKeys.add(key);
    this.keyPressTimestamps.set(key, performance.now());
  }

  public triggerSpecialCombo(comboId: SlashType) {
    this.executeSlash(comboId);
  }

  private touchComboStep: number = 0;

  // Smart single-button touch attack that dynamically adapts to running, airborne, or ground combo chains
  public triggerSmartTouchAttack() {
    const p = this.player;
    if (!p.saberActive) return;

    // Airborne -> Sky Crescent Slash (C)
    if (!p.isGrounded || Math.abs(p.vy) > 1.2) {
      this.executeSlash('UP');
      return;
    }

    // Fast running -> Forward Cross Cleave (X)
    if (Math.abs(p.vx) > 2.5) {
      this.executeSlash('MID');
      return;
    }

    // Chain combos on successive taps: MID -> UP -> DOWN -> XC Vortex
    const chain: SlashType[] = ['MID', 'UP', 'DOWN', 'COMBO_XC'];
    const chosen = chain[this.touchComboStep % chain.length];
    this.touchComboStep++;
    this.executeSlash(chosen);
  }

  // --- MAIN LOOP ---

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    const rawDt = (currentTime - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05); // Clamp dt for 60fps physics stability
    this.lastTime = currentTime;

    // Track FPS and auto optimize quality
    this.updateFpsTracking(currentTime, dt);

    if (this.state === 'PLAYING') {
      // Check hitstop pause
      if (!this.renderer.isHitstopActive()) {
        this.update(dt);
      }
    }

    // Render frame
    this.renderer.updateCamera(this.player.x, this.player.y, this.player.facingRight, dt);
    this.renderer.render(
      this.player,
      this.enemies,
      this.platforms,
      this.pickups,
      this.projectiles,
      this.particles,
      this.damageNumbers,
      this.saberColor,
      this.quality,
      this.isLowQualityActive,
      this.activeBoss
    );

    // Clear just-pressed buffer
    this.justPressedKeys.clear();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private updateFpsTracking(currentTime: number, dt: number) {
    if (dt > 0) {
      const fps = 1 / dt;
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > 45) {
        this.fpsHistory.shift();
      }
    }

    if (currentTime - this.lastFpsCheckTime > 1000) {
      this.lastFpsCheckTime = currentTime;
      const avgFps =
        this.fpsHistory.reduce((acc, v) => acc + v, 0) / (this.fpsHistory.length || 1);
      this.currentFps = Math.round(avgFps);

      // Auto Quality Adjustment: If avg FPS < 30, reduce graphics!
      if (this.quality === 'AUTO') {
        if (avgFps < 30 && !this.isLowQualityActive) {
          this.isLowQualityActive = true;
          if (this.onQualityAdjusted) this.onQualityAdjusted(true);
        } else if (avgFps >= 50 && this.isLowQualityActive) {
          this.isLowQualityActive = false;
          if (this.onQualityAdjusted) this.onQualityAdjusted(false);
        }
      }
    }
  }

  // --- GAME UPDATE ---

  private update(dt: number) {
    // 1. Process Saber Timer
    this.updateSaberTimer(dt);

    // 2. Process Player Movement & Jump Inputs
    this.updatePlayerMovement(dt);

    // 3. Process Slash & Combo Attacks
    this.updateSlashAttacks(dt);

    // 4. Update Enemies & Boss
    this.updateEnemies(dt);

    // 5. Update Pickups
    this.updatePickups();

    // 6. Update Projectiles & Particles
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.updateDamageNumbers(dt);

    // 7. Update Stats & Distance
    this.updateStats(dt);

    // 8. Generate more level chunks
    this.generateChunksAhead(2000);

    // 9. Notify UI
    if (this.onStatsChange) {
      this.onStatsChange(this.stats, this.player, this.activeBoss);
    }
  }

  private updateSaberTimer(dt: number) {
    const diffCfg = DIFFICULTY_CONFIGS[this.difficulty] || DIFFICULTY_CONFIGS.NORMAL;

    // Infinite Saber mode: timer never decays!
    if (diffCfg.isInfinite) {
      this.player.saberActive = true;
      this.player.saberTimer = 999;
      this.stats.saberTotalActiveSeconds += dt;
      return;
    }

    if (this.player.saberActive) {
      this.player.saberTimer -= dt;
      this.stats.saberTotalActiveSeconds += dt;

      if (this.player.saberTimer <= 0) {
        this.player.saberTimer = 0;
        this.player.saberActive = false;
        sound.playSaberExpire();
      }
    }
  }

  private updatePlayerMovement(dt: number) {
    const p = this.player;

    // Horizontal control
    let moveDir = 0;
    if (this.heldKeys.has('a') || this.heldKeys.has('arrowleft')) moveDir -= 1;
    if (this.heldKeys.has('d') || this.heldKeys.has('arrowright')) moveDir += 1;

    // In auto-runner feel, player always moves forward with slight user steer, or full directional
    const targetVx = moveDir !== 0 ? moveDir * MOVE_SPEED : p.isGrounded ? 0 : p.vx * AIR_DRAG;
    p.vx += (targetVx - p.vx) * (p.isGrounded ? 0.35 : 0.12);

    if (moveDir > 0) p.facingRight = true;
    else if (moveDir < 0) p.facingRight = false;

    p.isRunning = p.isGrounded && Math.abs(p.vx) > 0.4;
    if (p.isRunning) {
      p.animFrame += dt * 30;
    }

    // Jump Input (Space / W / ArrowUp)
    const jumpPressed =
      this.justPressedKeys.has(' ') ||
      this.justPressedKeys.has('w') ||
      this.justPressedKeys.has('arrowup');

    if (jumpPressed) {
      if (p.isGrounded) {
        p.vy = JUMP_FORCE;
        p.isGrounded = false;
        p.canDoubleJump = true;
        sound.playJump();
        this.spawnJumpParticles(p.x + p.width / 2, p.y + p.height);
      } else if (p.canDoubleJump) {
        // Double jump flip!
        p.vy = DOUBLE_JUMP_FORCE;
        p.canDoubleJump = false;
        sound.playJump();
        this.spawnJumpParticles(p.x + p.width / 2, p.y + p.height);
        this.renderer.triggerShake(3);
      }
    }

    // Apply Gravity
    p.vy += GRAVITY;

    // Move in X and resolve platform collisions
    p.x += p.vx;

    // Move in Y and resolve platform collisions
    p.y += p.vy;
    p.isGrounded = false;

    for (const plat of this.platforms) {
      if (
        p.x + p.width > plat.x &&
        p.x < plat.x + plat.width &&
        p.y + p.height >= plat.y &&
        p.y + p.height <= plat.y + 20 &&
        p.vy >= 0
      ) {
        // Land on platform top
        p.y = plat.y - p.height;
        p.vy = 0;
        p.isGrounded = true;
        p.canDoubleJump = true;
        break;
      }
    }

    // Pit Fall Check: if player falls off into void
    if (p.y > 650) {
      p.health -= 25;
      sound.playHit();
      this.renderer.triggerShake(14);

      if (p.health <= 0) {
        this.gameOver();
        return;
      }

      // Respawn on nearest platform
      const safePlat = this.platforms.find((pl) => pl.x > p.x - 200 && pl.x < p.x + 300) || this.platforms[0];
      if (safePlat) {
        p.x = safePlat.x + 40;
        p.y = safePlat.y - p.height - 30;
        p.vx = 0;
        p.vy = 0;
      }
    }

    // Update invulnerability
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer -= dt;
    }

    // Add afterimages during high speed or combo attacks
    if (p.currentSlash || Math.abs(p.vx) > 5) {
      if (Math.random() > 0.4) {
        p.afterimages.push({
          x: p.x,
          y: p.y,
          facingRight: p.facingRight,
          alpha: 0.8,
          slashType: p.currentSlash,
        });
      }
    }

    // Decay afterimages
    p.afterimages.forEach((img) => {
      img.alpha -= dt * 3.5;
    });
    p.afterimages = p.afterimages.filter((img) => img.alpha > 0);
  }

  // --- SLASH & COMBO SYSTEM ---

  private updateSlashAttacks(dt: number) {
    const p = this.player;

    // Check Multi-key Combo Inputs (X, C, V - Optimized for German QWERTZ & International keyboards)
    // Primary keys: X (Down/Low), C (Mid), V (Up)
    // Z and Y are also accepted as aliases for X so no keyboard layout is hindered!
    const isXHeld = this.heldKeys.has('x') || this.heldKeys.has('z') || this.heldKeys.has('y');
    const isCHeld = this.heldKeys.has('c');
    const isVHeld = this.heldKeys.has('v');

    const justX = this.justPressedKeys.has('x') || this.justPressedKeys.has('z') || this.justPressedKeys.has('y');
    const justC = this.justPressedKeys.has('c');
    const justV = this.justPressedKeys.has('v');

    // Triple key Ultimate: X + C + V
    if (isXHeld && isCHeld && isVHeld && (justX || justC || justV)) {
      this.executeSlash('ULTIMATE_XCV');
      return;
    }

    // Dual key combos:
    // X + C: Vortex Cyclone (360° spin)
    if (isXHeld && isCHeld && (justX || justC)) {
      this.executeSlash('COMBO_XC');
      return;
    }
    // C + V: Leaping Spiral Whirlwind
    if (isCHeld && isVHeld && (justC || justV)) {
      this.executeSlash('COMBO_CV');
      return;
    }
    // X + V: Eclipse Cross Detonation
    if (isXHeld && isVHeld && (justX || justV)) {
      this.executeSlash('COMBO_XV');
      return;
    }

    // Single Slashes:
    // V = Up Slash (Crescent sky arc)
    // C = Mid Slash (Plasma cross cleave)
    // X = Down Slash (Ground shockwave sweep)
    if (justV) {
      this.executeSlash('UP');
    } else if (justC) {
      this.executeSlash('MID');
    } else if (justX) {
      this.executeSlash('DOWN');
    }

    // Progress active slash
    if (p.currentSlash) {
      p.slashProgress += dt / (p.slashDuration / 1000);
      if (p.slashProgress >= 1) {
        p.currentSlash = null;
        p.slashProgress = 0;
      }
    }
  }

  private executeSlash(type: SlashType) {
    const p = this.player;
    if (!p.saberActive) {
      // Cannot attack without saber!
      return;
    }

    const combo = COMBO_MOVES[type];
    if (combo.isUltimate) {
      if (p.energy < 75) {
        // Not enough energy for ultimate, trigger XC instead
        type = 'COMBO_XC';
      } else {
        p.energy = 0; // Consume energy
        this.stats.ultimatesUsed++;
      }
    }

    const currentMove = COMBO_MOVES[type];
    p.currentSlash = type;
    p.slashProgress = 0;
    p.slashDuration = currentMove.duration;

    // Audio trigger
    if (type === 'ULTIMATE_ZXC') {
      sound.playSlash('ULTIMATE');
      this.renderer.triggerHitstop(12);
      this.renderer.triggerShake(24);
    } else if (['COMBO_XC', 'COMBO_XZ', 'COMBO_CZ'].includes(type)) {
      sound.playSlash('COMBO');
      this.renderer.triggerShake(10);
    } else {
      sound.playSlash(type as 'UP' | 'MID' | 'DOWN');
    }

    // Forward boost on Mid & XZ dash
    if (type === 'MID') {
      p.vx = p.facingRight ? SPRINT_SPEED : -SPRINT_SPEED;
    } else if (type === 'COMBO_XZ') {
      p.vx = p.facingRight ? SPRINT_SPEED * 1.8 : -SPRINT_SPEED * 1.8;
    } else if (type === 'UP') {
      p.vy = -6; // Upward air jump boost
    }

    // Check Slash Hitbox against all active enemies
    this.checkSlashHits(currentMove);
  }

  private checkSlashHits(move: typeof COMBO_MOVES[SlashType]) {
    const p = this.player;
    const slashRangeX = move.rangeX;
    const slashRangeY = move.rangeY;

    const hitBox = {
      x: p.facingRight ? p.x + p.width / 2 : p.x + p.width / 2 - slashRangeX,
      y: p.y + p.height / 2 - slashRangeY / 2,
      w: slashRangeX,
      h: slashRangeY,
    };

    let hitAny = false;

    this.enemies.forEach((enemy) => {
      if (enemy.state === 'DEAD') return;

      // Check AABB intersection
      if (
        hitBox.x < enemy.x + enemy.width &&
        hitBox.x + hitBox.w > enemy.x &&
        hitBox.y < enemy.y + enemy.height &&
        hitBox.y + hitBox.h > enemy.y
      ) {
        hitAny = true;
        this.damageEnemy(enemy, move);
      }
    });

    if (hitAny) {
      // Gain energy rapidly
      p.energy = Math.min(ENERGY_MAX, p.energy + move.energyGain);

      // Increase Combo counter
      this.stats.combo++;
      this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo);
      this.stats.comboTimer = COMBO_TIMEOUT;
      this.stats.comboMultiplier = 1 + Math.min(4, Math.floor(this.stats.combo / 5) * 0.25);

      // Hitstop & screen shake
      this.renderer.triggerHitstop(move.isUltimate ? 8 : 4);
      this.renderer.triggerShake(move.isUltimate ? 20 : 7);
    }
  }

  private damageEnemy(enemy: Enemy, move: typeof COMBO_MOVES[SlashType]) {
    // Check if enemy is a Shield guard facing player
    if (enemy.type === 'SHIELD') {
      const shieldFacingPlayer =
        (enemy.facingRight && this.player.x > enemy.x) ||
        (!enemy.facingRight && this.player.x < enemy.x);

      // Down slash 'Z' breaks shields!
      if (shieldFacingPlayer && move.id !== 'DOWN' && !move.isUltimate) {
        sound.playHit(false);
        this.spawnDamageNumber(enemy.x + enemy.width / 2, enemy.y, 'BLOCKED!', '#60a5fa', false);
        return;
      }
    }

    const isCrit = Math.random() < 0.25 || move.isUltimate;
    const finalDamage = Math.round(move.damage * this.stats.comboMultiplier * (isCrit ? 1.6 : 1.0));
    enemy.health -= finalDamage;

    sound.playHit(isCrit);

    // Stun logic (especially against bosses)
    const rollStun = Math.random() < move.stunChance;
    if (rollStun) {
      enemy.state = 'STUNNED';
      enemy.stunTimer = enemy.type === 'BOSS' ? 180 : 120; // 3 seconds
      sound.playStunSound();
      this.spawnDamageNumber(enemy.x + enemy.width / 2, enemy.y - 20, 'STUNNED!', '#fbbf24', true);
    }

    // Damage number popup
    this.spawnDamageNumber(
      enemy.x + enemy.width / 2,
      enemy.y,
      isCrit ? `${finalDamage} CRIT!` : `${finalDamage}`,
      isCrit ? '#ff007f' : '#00f0ff',
      isCrit
    );

    // Score increment
    this.stats.score += Math.round(finalDamage * 10 * this.stats.comboMultiplier);

    // Check Death
    if (enemy.health <= 0) {
      this.killEnemy(enemy, move);
    }
  }

  private killEnemy(enemy: Enemy, move: typeof COMBO_MOVES[SlashType]) {
    enemy.state = 'DEAD';
    sound.playEnemySlice();

    this.stats.enemiesKilled++;
    this.stats.score += enemy.scoreValue * this.stats.comboMultiplier;

    if (enemy.type === 'BOSS') {
      this.stats.bossesDefeated++;
      this.activeBoss = null;
      this.renderer.triggerShake(30);
      this.renderer.triggerHitstop(16);
      this.spawnExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ef4444', 50);

      // Boss drops massive score & +20s lightsaber bonus!
      this.player.saberTimer = Math.min(SABER_MAX_TIME, this.player.saberTimer + 20);
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
      return;
    }

    // Sliced Ragdoll Parts generation
    enemy.slicedParts = this.createSlicedEnemyParts(enemy, move);

    // Blood / plasma spark burst
    this.spawnExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 16);
  }

  private createSlicedEnemyParts(enemy: Enemy, move: typeof COMBO_MOVES[SlashType]): SlicedPart[] {
    const parts: SlicedPart[] = [];
    const dir = this.player.facingRight ? 1 : -1;

    // Head
    parts.push({
      x: enemy.x + enemy.width / 2,
      y: enemy.y + 10,
      vx: dir * (3 + Math.random() * 5),
      vy: -5 - Math.random() * 4,
      rotation: 0,
      vRot: (Math.random() - 0.5) * 0.3,
      width: 16,
      height: 16,
      color: enemy.color,
      isHead: true,
      alpha: 1.0,
    });

    // Upper Torso
    parts.push({
      x: enemy.x + enemy.width / 2,
      y: enemy.y + 24,
      vx: dir * (2 + Math.random() * 4),
      vy: -3 - Math.random() * 3,
      rotation: 0,
      vRot: (Math.random() - 0.5) * 0.2,
      width: 14,
      height: 14,
      color: enemy.color,
      isTorso: true,
      alpha: 1.0,
    });

    // Left Limb
    parts.push({
      x: enemy.x + 8,
      y: enemy.y + 36,
      vx: -dir * (2 + Math.random() * 3),
      vy: -2 - Math.random() * 2,
      rotation: 0,
      vRot: (Math.random() - 0.5) * 0.4,
      width: 18,
      height: 4,
      color: enemy.color,
      isLimb: true,
      alpha: 1.0,
    });

    return parts;
  }

  // --- ENEMIES & BOSS UPDATE ---

  private updateEnemies(dt: number) {
    const p = this.player;

    this.enemies.forEach((enemy) => {
      // Update sliced ragdoll parts if dead
      if (enemy.state === 'DEAD') {
        if (enemy.slicedParts) {
          enemy.slicedParts.forEach((part) => {
            part.x += part.vx;
            part.y += part.vy;
            part.vy += GRAVITY * 0.6;
            part.rotation += part.vRot;
            part.alpha -= dt * 0.6;
          });
        }
        return;
      }

      // Handle Stun
      if (enemy.state === 'STUNNED') {
        enemy.stunTimer--;
        if (enemy.stunTimer <= 0) {
          enemy.state = 'CHASE';
        }
        return;
      }

      // Update Facing direction towards player
      enemy.facingRight = p.x > enemy.x;

      const distToPlayer = Math.hypot(p.x - enemy.x, p.y - enemy.y);

      if (enemy.type === 'BOSS') {
        this.updateBossAI(enemy, dt, distToPlayer);
      } else if (enemy.type === 'DRONE') {
        // Drone flies in sinusoidal wave and fires laser downward
        enemy.x += (p.x - enemy.x > 0 ? 1 : -1) * 1.5;
        enemy.y += Math.sin(Date.now() * 0.005) * 1.2;

        enemy.attackCooldown--;
        if (enemy.attackCooldown <= 0 && distToPlayer < 400) {
          enemy.attackCooldown = 150;
          this.spawnProjectile(enemy.x, enemy.y + 15, 0, 4.5, '#ef4444', 15);
        }
      } else {
        // Ground Rogue / Shield - Smart AI with Platform Cliff & Edge Detection
        let onPlat: Platform | null = null;
        for (const pl of this.platforms) {
          if (
            enemy.x + enemy.width > pl.x &&
            enemy.x < pl.x + pl.width &&
            enemy.y + enemy.height >= pl.y - 6 &&
            enemy.y + enemy.height <= pl.y + 18 &&
            enemy.vy >= 0
          ) {
            onPlat = pl;
            break;
          }
        }

        if (onPlat) {
          enemy.y = onPlat.y - enemy.height;
          enemy.vy = 0;
          enemy.isGrounded = true;

          // Smart Chase & Edge Detection AI
          if (distToPlayer < 450) {
            const moveSpeed = enemy.type === 'SHIELD' ? 1.6 : 2.6;
            const desiredDir = p.x > enemy.x ? 1 : -1;
            enemy.facingRight = desiredDir > 0;
            const proposedVx = desiredDir * moveSpeed;
            const futureX = enemy.x + proposedVx;

            // Check if walking further would step off the platform edge (cliff detection!)
            const atLeftEdge = futureX < onPlat.x + 14;
            const atRightEdge = futureX + enemy.width > onPlat.x + onPlat.width - 14;

            if (atLeftEdge || atRightEdge) {
              // Enemy reached platform edge!
              // Check if player is on an adjacent platform across a small gap
              const isPlayerNearGap = Math.abs(p.x - enemy.x) < 140 && Math.abs(p.y - enemy.y) < 70;
              if (isPlayerNearGap && enemy.type !== 'SHIELD' && Math.random() < 0.08) {
                // Tactical leap jump towards player!
                enemy.vy = -10.5;
                enemy.vx = desiredDir * 4.5;
                enemy.isGrounded = false;
              } else {
                // STOP AT THE EDGE! Never fall off like an idiot!
                enemy.vx = 0;
              }
            } else {
              enemy.vx = proposedVx;
            }
          } else {
            // Idle patrol pacing back and forth on current platform without falling off
            if (enemy.vx === 0) enemy.vx = enemy.facingRight ? 1.0 : -1.0;
            if (enemy.x < onPlat.x + 16) {
              enemy.vx = 1.0;
              enemy.facingRight = true;
            } else if (enemy.x + enemy.width > onPlat.x + onPlat.width - 16) {
              enemy.vx = -1.0;
              enemy.facingRight = false;
            }
          }
        } else {
          // In the air: apply gravity
          enemy.vy += GRAVITY;
          enemy.isGrounded = false;
        }

        // Apply horizontal & vertical velocity
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Melee hit check against unarmed stickman
        if (distToPlayer < 36 && p.invulnerableTimer <= 0) {
          this.damagePlayer(18, enemy.x);
        }
      }
    });
  }

  private updateBossAI(boss: Enemy, dt: number, distToPlayer: number) {
    const p = this.player;

    boss.attackCooldown--;

    if (boss.attackCooldown <= 0) {
      boss.attackCooldown = 140;
      boss.bossAttackPattern = (boss.bossAttackPattern! + 1) % 3;

      if (boss.bossAttackPattern === 0) {
        // Shockwave leap stomp
        boss.vy = -12;
        boss.vx = (p.x > boss.x ? 1 : -1) * 6;
      } else if (boss.bossAttackPattern === 1) {
        // Crimson Plasma projectile spread
        for (let i = -1; i <= 1; i++) {
          const angle = Math.atan2(p.y - boss.y, p.x - boss.x) + i * 0.25;
          this.spawnProjectile(
            boss.x + boss.width / 2,
            boss.y + boss.height / 2,
            Math.cos(angle) * 5.5,
            Math.sin(angle) * 5.5,
            '#ef4444',
            22
          );
        }
      } else {
        // Rapid charge cleave
        boss.vx = (p.x > boss.x ? 1 : -1) * 8.5;
        this.renderer.triggerShake(12);
      }
    }

    // Boss physics
    boss.vy += GRAVITY * 0.8;
    boss.x += boss.vx;
    boss.y += boss.vy;
    boss.vx *= 0.94;

    // Boss ground collision
    for (const plat of this.platforms) {
      if (
        boss.x + boss.width > plat.x &&
        boss.x < plat.x + plat.width &&
        boss.y + boss.height >= plat.y &&
        boss.y + boss.height <= plat.y + 25 &&
        boss.vy >= 0
      ) {
        boss.y = plat.y - boss.height;
        boss.vy = 0;
        break;
      }
    }

    // Boss melee contact
    if (distToPlayer < 55 && p.invulnerableTimer <= 0) {
      this.damagePlayer(28, boss.x);
    }
  }

  private damagePlayer(amount: number, sourceX: number) {
    const p = this.player;
    p.health = Math.max(0, p.health - amount);
    p.invulnerableTimer = 1.0; // 1s invulnerability
    p.vy = -5.5;
    p.vx = (p.x > sourceX ? 1 : -1) * 6;

    sound.playHit();
    this.renderer.triggerShake(12);
    this.spawnDamageNumber(p.x + p.width / 2, p.y, `-${amount}`, '#ef4444', true);

    // Drop combo
    this.stats.combo = 0;
    this.stats.comboMultiplier = 1.0;

    if (p.health <= 0) {
      this.gameOver();
    }
  }

  // --- PICKUPS ---

  private updatePickups() {
    const p = this.player;

    this.pickups.forEach((pk) => {
      if (pk.collected) return;
      pk.bobOffset += 0.05;

      // Distance check to player
      const dist = Math.hypot(p.x - pk.x, p.y - pk.y);
      if (dist < 42) {
        pk.collected = true;

        const diffCfg = DIFFICULTY_CONFIGS[this.difficulty] || DIFFICULTY_CONFIGS.NORMAL;
        if (diffCfg.isInfinite) {
          p.saberTimer = 999;
          p.saberActive = true;
          this.spawnDamageNumber(pk.x, pk.y - 20, '∞ INFINITE SABER!', '#ec4899', true);
        } else {
          const bonus = diffCfg.pickupBonus > 0 ? diffCfg.pickupBonus : pk.bonusSeconds;
          const prevTimer = p.saberTimer;
          p.saberTimer = Math.min(diffCfg.maxTimer, p.saberTimer + bonus);
          const added = Math.round(p.saberTimer - prevTimer);
          this.spawnDamageNumber(pk.x, pk.y - 20, `+${added > 0 ? added : bonus}s SABER!`, '#00f0ff', true);
        }

        p.saberActive = true;
        this.stats.saberPickupsCollected++;
        this.stats.score += 500;

        sound.playPickup();
        sound.startSaberHum();

        this.spawnExplosion(pk.x, pk.y, '#00f0ff', 12);
      }
    });
  }

  // --- PROJECTILES, PARTICLES & NUMBERS ---

  private spawnProjectile(x: number, y: number, vx: number, vy: number, color: string, damage: number) {
    this.projectiles.push({
      id: 'proj-' + Math.random(),
      x,
      y,
      vx,
      vy,
      radius: 5,
      color,
      isHostile: true,
      damage,
      life: 180,
    });
  }

  private updateProjectiles(dt: number) {
    const p = this.player;

    this.projectiles.forEach((proj) => {
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.life--;

      // Hit player
      if (
        proj.isHostile &&
        p.invulnerableTimer <= 0 &&
        Math.hypot(p.x + p.width / 2 - proj.x, p.y + p.height / 2 - proj.y) < p.width / 2 + proj.radius
      ) {
        proj.life = 0;
        this.damagePlayer(proj.damage, proj.x);
      }
    });

    this.projectiles = this.projectiles.filter((proj) => proj.life > 0);
  }

  private spawnExplosion(x: number, y: number, color: string, count: number = 15) {
    const maxParticles = this.isLowQualityActive ? Math.min(count, 8) : count;
    for (let i = 0; i < maxParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: 20 + Math.random() * 20,
        glow: true,
      });
    }
  }

  private spawnJumpParticles(x: number, y: number) {
    const count = this.isLowQualityActive ? 4 : 8;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -1 - Math.random() * 2,
        size: 3,
        color: '#00f0ff',
        alpha: 0.8,
        life: 0,
        maxLife: 15,
      });
    }
  }

  private updateParticles(dt: number) {
    this.particles.forEach((pt) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += GRAVITY * 0.3;
      pt.life++;
      pt.alpha = 1 - pt.life / pt.maxLife;
    });

    this.particles = this.particles.filter((pt) => pt.life < pt.maxLife);
  }

  private spawnDamageNumber(x: number, y: number, text: string, color: string, isCrit: boolean = false) {
    this.damageNumbers.push({
      id: 'dmg-' + Math.random(),
      x,
      y,
      vy: -2.5,
      text,
      color,
      alpha: 1.0,
      isCrit,
    });
  }

  private updateDamageNumbers(dt: number) {
    this.damageNumbers.forEach((num) => {
      num.y += num.vy;
      num.vy *= 0.94;
      num.alpha -= dt * 1.4;
    });

    this.damageNumbers = this.damageNumbers.filter((num) => num.alpha > 0);
  }

  // --- STATS & COMBOS ---

  private updateStats(dt: number) {
    // Distance in meters
    const currentMeters = Math.max(0, Math.floor(this.player.x / 40));
    this.stats.distance = Math.max(this.stats.distance, currentMeters);

    // Combo decay timer
    if (this.stats.comboTimer > 0) {
      this.stats.comboTimer -= dt * 1000;
      if (this.stats.comboTimer <= 0) {
        this.stats.combo = 0;
        this.stats.comboMultiplier = 1.0;
      }
    }

    // Accelerate dynamic background music tempo based on distance & combo!
    const tension = Math.min(1.0, this.stats.distance / 1200 + this.stats.combo / 40);
    sound.setTempo(tension);
  }

  private gameOver() {
    this.state = 'GAME_OVER';
    sound.stopMusic();
    sound.stopSaberHum();

    if (this.onStateChange) {
      this.onStateChange('GAME_OVER');
    }
  }
}
