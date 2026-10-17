export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export type SaberColor = 'cyan' | 'emerald' | 'violet' | 'amber' | 'crimson' | 'plasma';

export interface SaberColorConfig {
  id: SaberColor;
  name: string;
  bladeColor: string;
  glowColor: string;
  coreColor: string;
  unlockScore: number;
}

export type SlashType =
  | 'UP'
  | 'MID'
  | 'DOWN'
  | 'COMBO_XC'
  | 'COMBO_XZ'
  | 'COMBO_CZ'
  | 'COMBO_CV'
  | 'COMBO_XV'
  | 'ULTIMATE_ZXC'
  | 'ULTIMATE_XCV';

export interface ComboMove {
  id: SlashType;
  name: string;
  keys: string;
  description: string;
  damage: number;
  energyGain: number;
  stunChance: number;
  duration: number; // frames or ms
  rangeX: number;
  rangeY: number;
  isUltimate?: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  canDoubleJump: boolean;
  facingRight: boolean;
  health: number;
  maxHealth: number;
  energy: number; // 0 - 100
  saberActive: boolean;
  saberTimer: number; // in seconds (0 - 60)
  currentSlash: SlashType | null;
  slashProgress: number; // 0 to 1
  slashDuration: number;
  invulnerableTimer: number;
  animFrame: number;
  isRunning: boolean;
  isSliding: boolean;
  afterimages: Array<{ x: number; y: number; facingRight: boolean; alpha: number; slashType: SlashType | null }>;
}

export type EnemyType = 'DRONE' | 'ROGUE' | 'SHIELD' | 'SNIPER' | 'BOSS';

export interface SlicedPart {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  width: number;
  height: number;
  color: string;
  isHead?: boolean;
  isTorso?: boolean;
  isLimb?: boolean;
  alpha: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  isGrounded: boolean;
  facingRight: boolean;
  attackCooldown: number;
  state: 'PATROL' | 'CHASE' | 'ATTACK' | 'STUNNED' | 'DEAD';
  stunTimer: number;
  telegraphTimer: number;
  slicedParts?: SlicedPart[];
  color: string;
  scoreValue: number;
  // Boss specific
  bossPhase?: number;
  bossAttackPattern?: number;
}

export interface SaberPickup {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  bobOffset: number;
  bonusSeconds: number; // 5s
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isSemiSolid?: boolean;
  glow?: boolean;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isHostile: boolean;
  damage: number;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  glow?: boolean;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  isCrit?: boolean;
}

export type GraphicQuality = 'AUTO' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  comboMultiplier: number;
  comboTimer: number;
  distance: number;
  enemiesKilled: number;
  bossesDefeated: number;
  saberPickupsCollected: number;
  saberTotalActiveSeconds: number;
  ultimatesUsed: number;
  stage: number;
}

export type DifficultyMode = 'CASUAL' | 'NORMAL' | 'HARDCORE' | 'INFINITE';

export interface DifficultyConfig {
  id: DifficultyMode;
  name: string;
  badge: string;
  description: string;
  starterTimer: number;
  pickupBonus: number;
  maxTimer: number;
  isInfinite: boolean;
  scoreMultiplier: number;
}

export interface UserSaveData {
  syncCode: string;
  playerName: string;
  highScore: number;
  maxCombo: number;
  totalKills: number;
  bossKills: number;
  gamesPlayed: number;
  unlockedSaberColors: SaberColor[];
  selectedSaberColor: SaberColor;
  audioVolume: number;
  isMuted: boolean;
  quality: GraphicQuality;
  difficulty: DifficultyMode;
  updatedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  maxCombo: number;
  stageReached: number;
  bossesDefeated: number;
  totalKills: number;
  saberActiveTime: number;
  date: string;
}
