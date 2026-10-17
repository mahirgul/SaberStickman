import { SaberColorConfig, ComboMove, SlashType } from '../types/game';

export const SABER_MAX_TIME = 60; // Max 60 seconds
export const SABER_PICKUP_TIME = 5; // Adds 5 seconds per pickup

export const SABER_COLORS: SaberColorConfig[] = [
  {
    id: 'cyan',
    name: 'Neon Cyan (Cyber)',
    bladeColor: '#00f0ff',
    glowColor: '#00b4d8',
    coreColor: '#ffffff',
    unlockScore: 0,
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald',
    bladeColor: '#10b981',
    glowColor: '#059669',
    coreColor: '#d1fae5',
    unlockScore: 3000,
  },
  {
    id: 'violet',
    name: 'Quantum Violet',
    bladeColor: '#a855f7',
    glowColor: '#7e22ce',
    coreColor: '#f3e8ff',
    unlockScore: 7000,
  },
  {
    id: 'amber',
    name: 'Plasma Amber',
    bladeColor: '#fbbf24',
    glowColor: '#d97706',
    coreColor: '#fef3c7',
    unlockScore: 12000,
  },
  {
    id: 'crimson',
    name: 'Crimson Sith',
    bladeColor: '#ef4444',
    glowColor: '#b91c1c',
    coreColor: '#fee2e2',
    unlockScore: 18000,
  },
  {
    id: 'plasma',
    name: 'Omega Prism',
    bladeColor: '#38bdf8',
    glowColor: '#ec4899',
    coreColor: '#ffffff',
    unlockScore: 25000,
  },
];

export const COMBO_MOVES: Record<SlashType, ComboMove> = {
  UP: {
    id: 'UP',
    name: 'Crescent Sky Slash',
    keys: 'C',
    description: 'Upward vertical arc launching flying drones and jumping enemies into the air',
    damage: 35,
    energyGain: 12,
    stunChance: 0.15,
    duration: 160,
    rangeX: 65,
    rangeY: 75,
  },
  MID: {
    id: 'MID',
    name: 'Plasma Cross Cleave',
    keys: 'X',
    description: 'Dashes forward, bisecting enemies with swift dual-slash cross strikes',
    damage: 42,
    energyGain: 15,
    stunChance: 0.20,
    duration: 180,
    rangeX: 80,
    rangeY: 45,
  },
  DOWN: {
    id: 'DOWN',
    name: 'Ground Shockwave Sweep',
    keys: 'Z',
    description: 'Low crouching sweep sending a ground wave that shatters enemy shields',
    damage: 38,
    energyGain: 14,
    stunChance: 0.30,
    duration: 200,
    rangeX: 95,
    rangeY: 35,
  },
  COMBO_XC: {
    id: 'COMBO_XC',
    name: 'Vortex Cyclone (XC)',
    keys: 'X + C',
    description: 'Spins in a 360-degree aerial cyclone shredding all surrounding enemies',
    damage: 75,
    energyGain: 25,
    stunChance: 0.45,
    duration: 320,
    rangeX: 110,
    rangeY: 90,
  },
  COMBO_XZ: {
    id: 'COMBO_XZ',
    name: 'Shadow Pierce Dash (XZ)',
    keys: 'X + Z',
    description: 'Hyperspeed phase-thrust penetrating through enemy ranks with afterimages',
    damage: 85,
    energyGain: 28,
    stunChance: 0.50,
    duration: 300,
    rangeX: 160,
    rangeY: 45,
  },
  COMBO_CZ: {
    id: 'COMBO_CZ',
    name: 'Eclipse Cross Burst (CZ)',
    keys: 'C + Z',
    description: 'Carves an explosive X-shaped plasma detonation into the battlefield',
    damage: 95,
    energyGain: 32,
    stunChance: 0.65,
    duration: 350,
    rangeX: 120,
    rangeY: 100,
  },
  ULTIMATE_ZXC: {
    id: 'ULTIMATE_ZXC',
    name: 'OMEGA DIMENSION CLEAVE (ZXC)',
    keys: 'Z + X + C',
    description: 'Freezes time and unleashes 7 lethal screen-wide neon cuts! Stuns bosses instantly.',
    damage: 260,
    energyGain: 0,
    stunChance: 1.0,
    duration: 800,
    rangeX: 450,
    rangeY: 300,
    isUltimate: true,
  },
};

export const GRAVITY = 0.58;
export const MOVE_SPEED = 5.2;
export const SPRINT_SPEED = 7.5;
export const JUMP_FORCE = -11.8;
export const DOUBLE_JUMP_FORCE = -10.2;
export const AIR_DRAG = 0.98;
export const GROUND_FRICTION = 0.85;

export const COMBO_TIMEOUT = 2500;
export const ENERGY_MAX = 100;
