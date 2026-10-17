import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

// Data Persistence paths
const DATA_DIR = path.resolve(__dirname, 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface ScoreEntry {
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

export interface CloudProfile {
  syncCode: string;
  playerName: string;
  highScore: number;
  maxCombo: number;
  totalKills: number;
  bossKills: number;
  gamesPlayed: number;
  unlockedSaberColors: string[];
  selectedSaberColor: string;
  updatedAt: string;
}

const defaultScores: ScoreEntry[] = [
  {
    id: 'score-1',
    playerName: 'CyberNinja_99',
    score: 18450,
    maxCombo: 42,
    stageReached: 5,
    bossesDefeated: 2,
    totalKills: 86,
    saberActiveTime: 145,
    date: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'score-2',
    playerName: 'NeonViper',
    score: 14200,
    maxCombo: 31,
    stageReached: 4,
    bossesDefeated: 1,
    totalKills: 64,
    saberActiveTime: 112,
    date: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'score-3',
    playerName: 'StickMaster_X',
    score: 11800,
    maxCombo: 28,
    stageReached: 3,
    bossesDefeated: 1,
    totalKills: 51,
    saberActiveTime: 95,
    date: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: 'score-4',
    playerName: 'BladeRunner',
    score: 9400,
    maxCombo: 22,
    stageReached: 3,
    bossesDefeated: 1,
    totalKills: 40,
    saberActiveTime: 78,
    date: new Date(Date.now() - 3600000 * 96).toISOString(),
  },
];

let leaderboard: ScoreEntry[] = [];
const cloudProfiles = new Map<string, CloudProfile>();

// Load or initialize leaderboard from disk
function loadLeaderboardFromDisk() {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
      leaderboard = JSON.parse(data);
    } else {
      leaderboard = [...defaultScores];
      fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('Failed to load leaderboard file, using defaults:', err);
    leaderboard = [...defaultScores];
  }
}

function saveLeaderboardToDisk() {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save leaderboard to disk:', err);
  }
}

// Load or initialize profiles from disk
function loadProfilesFromDisk() {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const data = fs.readFileSync(PROFILES_FILE, 'utf-8');
      const parsed: Record<string, CloudProfile> = JSON.parse(data);
      Object.entries(parsed).forEach(([k, v]) => cloudProfiles.set(k, v));
    } else {
      cloudProfiles.set('CYBER-77', {
        syncCode: 'CYBER-77',
        playerName: 'SaberPro',
        highScore: 16500,
        maxCombo: 38,
        totalKills: 72,
        bossKills: 2,
        gamesPlayed: 14,
        unlockedSaberColors: ['cyan', 'purple', 'emerald', 'crimson'],
        selectedSaberColor: 'cyan',
        updatedAt: new Date().toISOString(),
      });
      saveProfilesToDisk();
    }
  } catch (err) {
    console.warn('Failed to load profiles file:', err);
  }
}

function saveProfilesToDisk() {
  try {
    const obj = Object.fromEntries(cloudProfiles.entries());
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save profiles to disk:', err);
  }
}

loadLeaderboardFromDisk();
loadProfilesFromDisk();

// --- API ROUTES ---

// GET /api/leaderboard (with optional ?timeframe=all|week|today and ?search=...)
app.get('/api/leaderboard', (req, res) => {
  const timeframe = (req.query.timeframe as string) || 'all';
  const search = ((req.query.search as string) || '').toLowerCase().trim();

  let filtered = [...leaderboard];

  if (timeframe === 'today') {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    filtered = filtered.filter((item) => new Date(item.date).getTime() >= dayAgo);
  } else if (timeframe === 'week') {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    filtered = filtered.filter((item) => new Date(item.date).getTime() >= weekAgo);
  }

  if (search) {
    filtered = filtered.filter((item) => item.playerName.toLowerCase().includes(search));
  }

  const sorted = filtered.sort((a, b) => b.score - a.score).slice(0, 100);

  res.json({
    success: true,
    scores: sorted,
    totalRecords: leaderboard.length,
    highestScore: leaderboard.length > 0 ? Math.max(...leaderboard.map((s) => s.score)) : 0,
  });
});

// POST /api/leaderboard (Submit new high score to global board)
app.post('/api/leaderboard', (req, res) => {
  const { playerName, score, maxCombo, stageReached, bossesDefeated, totalKills, saberActiveTime } = req.body;
  if (!playerName || typeof score !== 'number') {
    res.status(400).json({ success: false, message: 'Invalid payload' });
    return;
  }

  const safeName = String(playerName).trim().slice(0, 18) || 'Stickman';
  const newEntry: ScoreEntry = {
    id: 'score-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    playerName: safeName,
    score: Math.max(0, Math.floor(score)),
    maxCombo: Math.max(0, Math.floor(maxCombo || 0)),
    stageReached: Math.max(1, Math.floor(stageReached || 1)),
    bossesDefeated: Math.max(0, Math.floor(bossesDefeated || 0)),
    totalKills: Math.max(0, Math.floor(totalKills || 0)),
    saberActiveTime: Math.max(0, Math.floor(saberActiveTime || 0)),
    date: new Date().toISOString(),
  };

  leaderboard.push(newEntry);
  leaderboard.sort((a, b) => b.score - a.score);

  // Keep top 200 records to prevent unbounded disk growth
  if (leaderboard.length > 200) {
    leaderboard = leaderboard.slice(0, 200);
  }

  saveLeaderboardToDisk();

  // Find rank of newly submitted score
  const rank = leaderboard.findIndex((item) => item.id === newEntry.id) + 1;
  res.json({ success: true, entry: newEntry, rank });
});

// GET /api/cloud-save/:code (Retrieve saved user progress)
app.get('/api/cloud-save/:code', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const profile = cloudProfiles.get(code);
  if (!profile) {
    res.status(404).json({ success: false, message: 'Sync code not found' });
    return;
  }
  res.json({ success: true, profile });
});

// POST /api/cloud-save/:code (Save/update user progress)
app.post('/api/cloud-save/:code', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const existing = cloudProfiles.get(code);

  const payload = req.body || {};
  const updatedProfile: CloudProfile = {
    syncCode: code,
    playerName: String(payload.playerName || existing?.playerName || 'Player').slice(0, 18),
    highScore: Math.max(existing?.highScore || 0, Number(payload.highScore) || 0),
    maxCombo: Math.max(existing?.maxCombo || 0, Number(payload.maxCombo) || 0),
    totalKills: (existing?.totalKills || 0) + (Number(payload.newKills) || 0),
    bossKills: (existing?.bossKills || 0) + (Number(payload.newBossKills) || 0),
    gamesPlayed: (existing?.gamesPlayed || 0) + (Number(payload.incrementGames) || 1),
    unlockedSaberColors: Array.isArray(payload.unlockedSaberColors)
      ? Array.from(new Set([...(existing?.unlockedSaberColors || ['cyan']), ...payload.unlockedSaberColors]))
      : existing?.unlockedSaberColors || ['cyan'],
    selectedSaberColor: payload.selectedSaberColor || existing?.selectedSaberColor || 'cyan',
    updatedAt: new Date().toISOString(),
  };

  cloudProfiles.set(code, updatedProfile);
  saveProfilesToDisk();

  res.json({ success: true, profile: updatedProfile });
});

// Vite Middleware for development & static serving for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Server] Saber Stickman Neon Edge listening on port ${PORT}`);
  });
}

startServer();
