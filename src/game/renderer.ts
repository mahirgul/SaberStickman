import {
  PlayerState,
  Enemy,
  Platform,
  SaberPickup,
  Projectile,
  Particle,
  DamageNumber,
  SaberColorConfig,
  GraphicQuality,
  SlashType,
  SlicedPart,
} from '../types/game';
import { SABER_COLORS } from './constants';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private cameraX: number = 0;
  private cameraY: number = 0;
  private targetCameraX: number = 0;
  private targetCameraY: number = 0;
  private shakeAmount: number = 0;
  private hitstopDuration: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public setSize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  public triggerShake(amount: number = 10) {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  public triggerHitstop(frames: number = 4) {
    this.hitstopDuration = Math.max(this.hitstopDuration, frames);
  }

  public isHitstopActive(): boolean {
    if (this.hitstopDuration > 0) {
      this.hitstopDuration--;
      return true;
    }
    return false;
  }

  public updateCamera(targetX: number, targetY: number, facingRight: boolean, dt: number) {
    // Lead camera slightly ahead in movement direction
    const leadDistance = facingRight ? 140 : -100;
    this.targetCameraX = targetX + leadDistance - this.width * 0.35;
    this.targetCameraY = targetY - this.height * 0.55;

    // Smooth camera lerp
    const lerpFactor = Math.min(1, dt * 6.0);
    this.cameraX += (this.targetCameraX - this.cameraX) * lerpFactor;
    this.cameraY += (this.targetCameraY - this.cameraY) * lerpFactor;

    // Camera shake decay
    if (this.shakeAmount > 0.05) {
      this.shakeAmount *= 0.88;
    } else {
      this.shakeAmount = 0;
    }
  }

  public render(
    player: PlayerState,
    enemies: Enemy[],
    platforms: Platform[],
    pickups: SaberPickup[],
    projectiles: Projectile[],
    particles: Particle[],
    damageNumbers: DamageNumber[],
    saberColorId: string,
    quality: GraphicQuality,
    isLowQualityActive: boolean,
    bossActive: Enemy | null
  ) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Camera shake offsets
    const shakeX = (Math.random() - 0.5) * this.shakeAmount * 2;
    const shakeY = (Math.random() - 0.5) * this.shakeAmount * 2;

    const camX = this.cameraX + shakeX;
    const camY = this.cameraY + shakeY;

    // Determine bloom/glow allowance based on quality
    const allowGlow = quality !== 'LOW' && !isLowQualityActive;

    // 1. Clear & Background Sky
    ctx.save();
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, w, h);

    // Parallax Layer 1: Retro Neon Cyber Horizon & Distant Grid
    this.renderParallaxSky(camX, camY, allowGlow);

    // World transform
    ctx.translate(-camX, -camY);

    // 2. Render Platforms
    this.renderPlatforms(platforms, allowGlow);

    // 3. Render Pickups (Lightsabers)
    this.renderPickups(pickups, saberColorId, allowGlow);

    // 4. Render Enemies & Bosses
    this.renderEnemies(enemies, allowGlow);

    // 5. Render Sliced Enemy Parts (Ragdoll dismemberment)
    this.renderSlicedParts(enemies);

    // 6. Render Player Afterimages
    this.renderAfterimages(player, saberColorId);

    // 7. Render Player Stickman & Saber
    this.renderPlayer(player, saberColorId, allowGlow);

    // 8. Render Projectiles
    this.renderProjectiles(projectiles, allowGlow);

    // 9. Render Particles (Sparks, laser trails, explosions)
    this.renderParticles(particles, allowGlow);

    // 10. Render Floating Damage Numbers
    this.renderDamageNumbers(damageNumbers);

    ctx.restore();

    // 11. Screen-wide effects (Vignette & Boss Alarm Flash)
    if (bossActive && bossActive.state === 'ATTACK') {
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  private renderParallaxSky(camX: number, camY: number, allowGlow: boolean) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Distant Neon Grid Horizon
    const horizonY = h * 0.72 - camY * 0.15;

    // Cyberpunk gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#040711');
    skyGrad.addColorStop(0.65, '#0b1329');
    skyGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY);

    // Giant Retro Cyber Sun / Moon
    const sunX = w * 0.8 - (camX * 0.05) % w;
    const sunY = horizonY - 110;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 90);
    sunGrad.addColorStop(0, '#ff007f');
    sunGrad.addColorStop(0.5, '#7928ca');
    sunGrad.addColorStop(1, 'rgba(121, 40, 202, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
    ctx.fill();

    // Distant silhouette city towers (vector skyline)
    ctx.fillStyle = '#090d1c';
    const cityOffset = (camX * 0.12) % 180;
    for (let x = -180; x < w + 180; x += 65) {
      const colX = x - cityOffset;
      const colH = 60 + Math.sin(colX * 0.03) * 45 + ((colX * 17) % 70);
      ctx.fillRect(colX, horizonY - colH, 50, colH);

      // Window neon light dots
      if (allowGlow && (colX % 3 === 0)) {
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(colX + 12, horizonY - colH + 20, 4, 4);
        ctx.fillRect(colX + 28, horizonY - colH + 35, 4, 4);
        ctx.fillStyle = '#090d1c';
      }
    }

    // Perspective Ground Grid (Outrun / Synthwave vector lines)
    ctx.fillStyle = '#080c1e';
    ctx.fillRect(0, horizonY, w, h - horizonY);

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
    ctx.lineWidth = 1.2;

    // Horizontal perspective lines
    for (let y = horizonY; y < h; y += 18 + (y - horizonY) * 0.18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Vanishing perspective vertical lines
    const gridOffset = (camX * 0.28) % 80;
    const vpX = w * 0.5;
    for (let x = -w * 0.5; x < w * 1.5; x += 75) {
      const groundX = x - gridOffset;
      ctx.beginPath();
      ctx.moveTo(vpX, horizonY);
      ctx.lineTo(groundX, h);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderPlatforms(platforms: Platform[], allowGlow: boolean) {
    const ctx = this.ctx;

    platforms.forEach((p) => {
      // Platform body: sleek slate cyber block
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(p.x, p.y, p.width, p.height);

      // Top edge neon beam
      ctx.save();
      if (allowGlow) {
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(p.x, p.y, p.width, 3);

      // Decorative sci-fi circuit accents
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.width, p.height);

      // Circuit tick marks
      for (let tx = p.x + 20; tx < p.x + p.width - 20; tx += 60) {
        ctx.strokeRect(tx, p.y + 8, 12, 4);
      }
      ctx.restore();
    });
  }

  private renderPickups(pickups: SaberPickup[], saberColorId: string, allowGlow: boolean) {
    const ctx = this.ctx;
    const saberCfg = SABER_COLORS.find((c) => c.id === saberColorId) || SABER_COLORS[0];

    pickups.forEach((p) => {
      if (p.collected) return;

      const y = p.y + Math.sin(p.bobOffset) * 6;

      ctx.save();
      ctx.translate(p.x + p.width / 2, y + p.height / 2);
      ctx.rotate(0.35 + Math.sin(p.bobOffset * 0.8) * 0.2);

      // Saber Hilt
      ctx.fillStyle = '#475569';
      ctx.fillRect(-4, 10, 8, 18);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-5, 12, 10, 3);
      ctx.fillRect(-5, 22, 10, 3);

      // Glowing Neon Blade
      if (allowGlow) {
        ctx.shadowColor = saberCfg.bladeColor;
        ctx.shadowBlur = 16;
      }
      ctx.strokeStyle = saberCfg.bladeColor;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(0, -32);
      ctx.stroke();

      // Blade Core (pure bright white)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 9);
      ctx.lineTo(0, -31);
      ctx.stroke();

      ctx.restore();

      // Floating "+5s" badge
      ctx.save();
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.fillStyle = saberCfg.bladeColor;
      ctx.textAlign = 'center';
      ctx.fillText('+5s SABER', p.x + p.width / 2, y - 14);
      ctx.restore();
    });
  }

  private renderEnemies(enemies: Enemy[], allowGlow: boolean) {
    const ctx = this.ctx;

    enemies.forEach((e) => {
      if (e.state === 'DEAD') return;

      ctx.save();
      ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
      if (!e.facingRight) {
        ctx.scale(-1, 1);
      }

      // Stun visual stars
      if (e.state === 'STUNNED') {
        const angle = Date.now() * 0.008;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const sa = angle + (i * Math.PI * 2) / 3;
          const sx = Math.cos(sa) * 22;
          const sy = Math.sin(sa) * 10 - e.height * 0.5 - 12;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Attack telegraph red line/glow
      if (e.telegraphTimer > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(80, 0);
        ctx.stroke();
        ctx.restore();
      }

      if (e.type === 'BOSS') {
        this.renderBossStickman(e, allowGlow);
      } else if (e.type === 'DRONE') {
        this.renderDrone(e, allowGlow);
      } else if (e.type === 'SHIELD') {
        this.renderShieldRogue(e, allowGlow);
      } else {
        this.renderRogueStickman(e, allowGlow);
      }

      ctx.restore();

      // Enemy Health Bar
      if (e.health < e.maxHealth || e.type === 'BOSS') {
        this.renderEnemyHealthBar(e);
      }
    });
  }

  private renderRogueStickman(e: Enemy, allowGlow: boolean) {
    const ctx = this.ctx;
    const bodyColor = e.color || '#ef4444';

    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Head with cyber visor
    ctx.beginPath();
    ctx.arc(0, -18, 9, 0, Math.PI * 2);
    ctx.stroke();

    // Red visor slit
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(2, -20, 6, 3);

    // Torso
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // Legs
    const runCycle = Math.sin(Date.now() * 0.015);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-7 + runCycle * 6, 26);
    ctx.moveTo(0, 10);
    ctx.lineTo(7 - runCycle * 6, 26);
    ctx.stroke();

    // Arms & Weapon (Stun Baton)
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(12, 2);
    ctx.stroke();

    // Neon Baton
    if (allowGlow) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
    }
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(24, -6);
    ctx.stroke();
  }

  private renderShieldRogue(e: Enemy, allowGlow: boolean) {
    this.renderRogueStickman(e, allowGlow);
    const ctx = this.ctx;

    // Glowing Neon Energy Shield in front
    ctx.save();
    if (allowGlow) {
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 12;
    }
    ctx.strokeStyle = '#60a5fa';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(18, 0, 7, 28, 0, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private renderDrone(e: Enemy, allowGlow: boolean) {
    const ctx = this.ctx;
    const bodyColor = '#f59e0b';

    ctx.save();
    if (allowGlow) {
      ctx.shadowColor = bodyColor;
      ctx.shadowBlur = 10;
    }

    // Drone central sphere
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing red ocular lens
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(4, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Rotor blades / thrusters
    const spin = Date.now() * 0.03;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, -10 + Math.sin(spin) * 3);
    ctx.lineTo(-6, -8);
    ctx.moveTo(6, -8);
    ctx.lineTo(22, -10 + Math.cos(spin) * 3);
    ctx.stroke();

    ctx.restore();
  }

  private renderBossStickman(boss: Enemy, allowGlow: boolean) {
    const ctx = this.ctx;
    ctx.scale(1.8, 1.8); // 1.8x massive boss scale!

    const isStunned = boss.state === 'STUNNED';
    const mainColor = isStunned ? '#fbbf24' : '#ef4444';

    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Massive Cybernetic Helmet with horns/spikes
    ctx.beginPath();
    ctx.arc(0, -22, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Crown / Spikes
    ctx.beginPath();
    ctx.moveTo(-10, -32);
    ctx.lineTo(-6, -26);
    ctx.moveTo(0, -36);
    ctx.lineTo(0, -28);
    ctx.moveTo(10, -32);
    ctx.lineTo(6, -26);
    ctx.stroke();

    // Visor
    ctx.fillStyle = isStunned ? '#fef08a' : '#ff0055';
    ctx.fillRect(2, -25, 9, 5);

    // Torso with armor plate
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 14);
    ctx.stroke();

    // Legs
    const stomping = Math.sin(Date.now() * 0.008) * 4;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(-12, 34 + stomping);
    ctx.moveTo(0, 14);
    ctx.lineTo(12, 34 - stomping);
    ctx.stroke();

    // Dual Giant Crimson Sabers
    ctx.save();
    if (allowGlow) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 18;
    }
    ctx.strokeStyle = '#ff0033';
    ctx.lineWidth = 5.5;

    // Right hand saber
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(38, -18);
    ctx.stroke();

    // White core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(37, -17);
    ctx.stroke();
    ctx.restore();
  }

  private renderEnemyHealthBar(e: Enemy) {
    const ctx = this.ctx;
    const bw = e.type === 'BOSS' ? 120 : 36;
    const bh = e.type === 'BOSS' ? 8 : 4;
    const bx = e.x + e.width / 2 - bw / 2;
    const by = e.y - 18;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(bx, by, bw, bh);

    // Fill
    const pct = Math.max(0, e.health / e.maxHealth);
    ctx.fillStyle = e.type === 'BOSS' ? '#ef4444' : '#f87171';
    ctx.fillRect(bx, by, bw * pct, bh);

    // Boss Stun Bar
    if (e.type === 'BOSS') {
      const stunPct = e.state === 'STUNNED' ? e.stunTimer / 200 : (1 - e.health / e.maxHealth) % 1;
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(bx, by + bh + 2, bw * stunPct, 3);
    }
  }

  private renderSlicedParts(enemies: Enemy[]) {
    const ctx = this.ctx;

    enemies.forEach((e) => {
      if (!e.slicedParts) return;

      e.slicedParts.forEach((part) => {
        if (part.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = part.alpha;
        ctx.translate(part.x, part.y);
        ctx.rotate(part.rotation);

        ctx.strokeStyle = part.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        if (part.isHead) {
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.stroke();
        } else if (part.isTorso) {
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(0, 8);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(-part.width / 2, 0);
          ctx.lineTo(part.width / 2, 0);
          ctx.stroke();
        }

        // Severed Edge Glow (cauterized neon edge)
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(part.width / 2, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });
    });
  }

  private renderAfterimages(player: PlayerState, saberColorId: string) {
    const ctx = this.ctx;
    const saberCfg = SABER_COLORS.find((c) => c.id === saberColorId) || SABER_COLORS[0];

    player.afterimages.forEach((img) => {
      if (img.alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = img.alpha * 0.45;
      ctx.translate(img.x + player.width / 2, img.y + player.height / 2);
      if (!img.facingRight) ctx.scale(-1, 1);

      ctx.strokeStyle = saberCfg.bladeColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      // Ghost stickman silhouette
      ctx.beginPath();
      ctx.arc(0, -18, 8, 0, Math.PI * 2);
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 10);
      ctx.moveTo(0, 10);
      ctx.lineTo(-8, 26);
      ctx.moveTo(0, 10);
      ctx.lineTo(8, 26);
      ctx.stroke();

      ctx.restore();
    });
  }

  private renderPlayer(player: PlayerState, saberColorId: string, allowGlow: boolean) {
    const ctx = this.ctx;
    const saberCfg = SABER_COLORS.find((c) => c.id === saberColorId) || SABER_COLORS[0];

    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    if (!player.facingRight) {
      ctx.scale(-1, 1);
    }

    // Invulnerability flashing
    if (player.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // 100% Energy Aura
    if (player.energy >= 100 && allowGlow) {
      ctx.save();
      ctx.shadowColor = saberCfg.bladeColor;
      ctx.shadowBlur = 24;
      ctx.strokeStyle = saberCfg.bladeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const auraPulse = Math.sin(Date.now() * 0.01) * 4;
      ctx.arc(0, 2, 28 + auraPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Stickman Body (Crisp high-contrast vector lines)
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const isAttacking = player.currentSlash !== null;
    const progress = player.slashProgress;

    // Head
    ctx.beginPath();
    ctx.arc(0, -19, 8.5, 0, Math.PI * 2);
    ctx.stroke();

    // Cyber Headband / Visor (Neon Cyan)
    ctx.save();
    ctx.fillStyle = saberCfg.bladeColor;
    ctx.fillRect(1, -21, 8, 3.5);
    // Flowing bandana ribbon behind head
    const wind = Math.sin(Date.now() * 0.02) * 5;
    ctx.strokeStyle = saberCfg.bladeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-7, -19);
    ctx.quadraticCurveTo(-16, -17 + wind, -24, -14 + wind * 1.5);
    ctx.stroke();
    ctx.restore();

    // Torso (leans forward when running)
    const leanAngle = player.isRunning ? 0.25 : 0;
    ctx.save();
    ctx.rotate(leanAngle);

    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // Procedural Legs Animation
    if (!player.isGrounded) {
      // In-air tuck / jump pose
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(-8, 20);
      ctx.lineTo(-4, 28);
      ctx.moveTo(0, 10);
      ctx.lineTo(8, 16);
      ctx.lineTo(14, 25);
      ctx.stroke();
    } else if (player.isRunning) {
      // Fluid running stride
      const stride = Math.sin(player.animFrame * 0.4);
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(-12 * stride, 18);
      ctx.lineTo(-18 * stride, 29);
      ctx.moveTo(0, 10);
      ctx.lineTo(12 * stride, 18);
      ctx.lineTo(18 * stride, 29);
      ctx.stroke();
    } else {
      // Idle combat stance
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(-6, 28);
      ctx.moveTo(0, 10);
      ctx.lineTo(7, 28);
      ctx.stroke();
    }
    ctx.restore();

    // Arms & Lightsaber Rendering
    if (player.saberActive) {
      this.renderPlayerSaberAndArms(player, saberCfg, isAttacking, progress, allowGlow);
    } else {
      // Unarmed parkour martial stance
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(-10, 4);
      ctx.lineTo(-6, 12);
      ctx.moveTo(0, -4);
      ctx.lineTo(10, 0);
      ctx.lineTo(16, 6);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderPlayerSaberAndArms(
    player: PlayerState,
    cfg: SaberColorConfig,
    isAttacking: boolean,
    progress: number,
    allowGlow: boolean
  ) {
    const ctx = this.ctx;

    let saberAngle = -0.6; // resting ready angle
    let handX = 8;
    let handY = 2;

    if (isAttacking && player.currentSlash) {
      const type = player.currentSlash;

      if (type === 'UP') {
        // High upward arc (C): sweeps from bottom-right (0.5 rad) to top-left (-2.4 rad)
        saberAngle = 0.5 - progress * 3.0;
        handX = 10 + progress * 6;
        handY = 6 - progress * 16;
        this.renderSlashArc(cfg, handX, handY, -1.8, 1.2, 55, allowGlow);
      } else if (type === 'MID') {
        // Horizontal forward cleave (X): sweeps across 180 degrees horizontally
        saberAngle = -2.2 + progress * 3.4;
        handX = 6 + progress * 18;
        handY = 0;
        this.renderSlashHorizontal(cfg, handX, handY, 70, allowGlow);
      } else if (type === 'DOWN') {
        // Downward ground slide sweep (Z): chops down to ground with plasma shockwave
        saberAngle = -1.2 + progress * 2.8;
        handX = 12;
        handY = 4 + progress * 8;
        this.renderGroundWave(cfg, handX + 20, handY + 20, progress, allowGlow);
      } else if (type === 'COMBO_XC') {
        // Vortex 360 Cyclone
        saberAngle = progress * Math.PI * 4;
        this.renderVortexTrail(cfg, allowGlow);
      } else if (type === 'COMBO_XZ' || type === 'COMBO_CV') {
        // Hyper thrust / Leaping spiral beam
        saberAngle = type === 'COMBO_CV' ? progress * Math.PI * 2 : 0;
        handX = 22;
        handY = type === 'COMBO_CV' ? -progress * 12 : 0;
        this.renderThrustBeam(cfg, allowGlow);
      } else if (type === 'COMBO_CZ' || type === 'COMBO_XV') {
        // Cross Eclipse "X" slash
        saberAngle = -0.8 + progress * 2.5;
        this.renderCrossEclipse(cfg, progress, allowGlow);
      } else if (type === 'ULTIMATE_ZXC' || type === 'ULTIMATE_XCV') {
        // OMEGA DIMENSION ULTIMATE
        saberAngle = progress * Math.PI * 6;
        this.renderOmegaUltimate(cfg, progress, allowGlow);
      }
    }

    // Arms
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // Saber Hilt
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(saberAngle);

    ctx.fillStyle = '#64748b';
    ctx.fillRect(-3, -3, 6, 12);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4, 0, 8, 3);

    // Glowing Saber Blade
    const bladeLength = isAttacking && player.currentSlash === 'ULTIMATE_ZXC' ? 62 : 46;

    if (allowGlow) {
      ctx.shadowColor = cfg.bladeColor;
      ctx.shadowBlur = 18;
    }
    ctx.strokeStyle = cfg.bladeColor;
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(0, -bladeLength);
    ctx.stroke();

    // Core white light
    ctx.strokeStyle = cfg.coreColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(0, -bladeLength + 2);
    ctx.stroke();

    ctx.restore();
  }

  // --- SPECIAL ATTACK VISUAL TRAILS ---

  private renderSlashArc(
    cfg: SaberColorConfig,
    x: number,
    y: number,
    startAngle: number,
    endAngle: number,
    radius: number,
    allowGlow: boolean
  ) {
    const ctx = this.ctx;
    ctx.save();
    if (allowGlow) {
      ctx.shadowColor = cfg.bladeColor;
      ctx.shadowBlur = 15;
    }
    ctx.strokeStyle = cfg.bladeColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.stroke();
    ctx.restore();
  }

  private renderSlashHorizontal(cfg: SaberColorConfig, x: number, y: number, length: number, allowGlow: boolean) {
    const ctx = this.ctx;
    ctx.save();
    if (allowGlow) {
      ctx.shadowColor = cfg.bladeColor;
      ctx.shadowBlur = 16;
    }
    ctx.strokeStyle = cfg.bladeColor;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + length, y);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + length, y);
    ctx.stroke();
    ctx.restore();
  }

  private renderGroundWave(cfg: SaberColorConfig, x: number, y: number, progress: number, allowGlow: boolean) {
    const ctx = this.ctx;
    ctx.save();
    if (allowGlow) {
      ctx.shadowColor = cfg.bladeColor;
      ctx.shadowBlur = 14;
    }
    const waveDist = progress * 70;
    ctx.strokeStyle = cfg.bladeColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + waveDist, y, 18, -Math.PI / 2, Math.PI / 4);
    ctx.stroke();
    ctx.restore();
  }

  private renderVortexTrail(cfg: SaberColorConfig, allowGlow: boolean) {
    const ctx = this.ctx;
    ctx.save();
    if (allowGlow) {
      ctx.shadowColor = cfg.bladeColor;
      ctx.shadowBlur = 20;
    }
    ctx.strokeStyle = cfg.bladeColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private renderThrustBeam(cfg: SaberColorConfig, allowGlow: boolean) {
    const ctx = this.ctx;
    ctx.save();
    if (allowGlow) {
      ctx.shadowColor = cfg.bladeColor;
      ctx.shadowBlur = 22;
    }
    ctx.strokeStyle = cfg.bladeColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(130, 0);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(130, 0);
    ctx.stroke();
    ctx.restore();
  }

  private renderCrossEclipse(cfg: SaberColorConfig, progress: number, allowGlow: boolean) {
    const ctx = this.ctx;
    ctx.save();
    if (allowGlow) {
      ctx.shadowColor = cfg.bladeColor;
      ctx.shadowBlur = 24;
    }
    const size = 50 * progress;
    ctx.strokeStyle = cfg.bladeColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-size + 20, -size);
    ctx.lineTo(size + 20, size);
    ctx.moveTo(size + 20, -size);
    ctx.lineTo(-size + 20, size);
    ctx.stroke();
    ctx.restore();
  }

  private renderOmegaUltimate(cfg: SaberColorConfig, progress: number, allowGlow: boolean) {
    const ctx = this.ctx;
    ctx.save();
    if (allowGlow) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 30;
    }

    // Screen-wide geometric slash lines
    ctx.strokeStyle = cfg.bladeColor;
    ctx.lineWidth = 8;
    for (let i = 0; i < 5; i++) {
      const offset = (i - 2) * 50;
      ctx.beginPath();
      ctx.moveTo(-250, offset - 100);
      ctx.lineTo(350, offset + 100);
      ctx.stroke();
    }

    // Expanding shock ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, progress * 180, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private renderProjectiles(projectiles: Projectile[], allowGlow: boolean) {
    const ctx = this.ctx;

    projectiles.forEach((p) => {
      ctx.save();
      if (allowGlow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Projectile tail
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
      ctx.stroke();

      ctx.restore();
    });
  }

  private renderParticles(particles: Particle[], allowGlow: boolean) {
    const ctx = this.ctx;

    particles.forEach((pt) => {
      if (pt.alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = pt.alpha;
      if (allowGlow && pt.glow) {
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 6;
      }
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      ctx.restore();
    });
  }

  private renderDamageNumbers(numbers: DamageNumber[]) {
    const ctx = this.ctx;

    numbers.forEach((num) => {
      if (num.alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = num.alpha;
      ctx.font = num.isCrit
        ? 'bold 20px Outfit, sans-serif'
        : 'bold 15px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = num.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(num.text, num.x, num.y);
      ctx.restore();
    });
  }
}
