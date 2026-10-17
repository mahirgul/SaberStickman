import { UserSaveData, LeaderboardEntry, SaberColor, GraphicQuality } from '../types/game';

const LOCAL_STORAGE_KEY = 'saber_stickman_save_v1';

function generateRandomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

export function getDefaultSaveData(): UserSaveData {
  return {
    syncCode: generateRandomCode(),
    playerName: 'CyberSaber',
    highScore: 0,
    maxCombo: 0,
    totalKills: 0,
    bossKills: 0,
    gamesPlayed: 0,
    unlockedSaberColors: ['cyan'],
    selectedSaberColor: 'cyan',
    audioVolume: 0.7,
    isMuted: false,
    quality: 'AUTO',
    difficulty: 'NORMAL',
    updatedAt: new Date().toISOString(),
  };
}

export function loadLocalSave(): UserSaveData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...getDefaultSaveData(),
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Could not read local save:', e);
  }
  const defaultData = getDefaultSaveData();
  saveLocal(defaultData);
  return defaultData;
}

export function saveLocal(data: UserSaveData): void {
  try {
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not write local save:', e);
  }
}

// Cloud API methods
export async function syncToCloud(data: UserSaveData): Promise<UserSaveData | null> {
  saveLocal(data);
  try {
    const res = await fetch(`/api/cloud-save/${encodeURIComponent(data.syncCode)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Cloud sync failed with status ' + res.status);
    const json = await res.json();
    if (json.success && json.profile) {
      const merged: UserSaveData = {
        ...data,
        playerName: json.profile.playerName || data.playerName,
        highScore: Math.max(data.highScore, json.profile.highScore || 0),
        maxCombo: Math.max(data.maxCombo, json.profile.maxCombo || 0),
        totalKills: Math.max(data.totalKills, json.profile.totalKills || 0),
        bossKills: Math.max(data.bossKills, json.profile.bossKills || 0),
        gamesPlayed: Math.max(data.gamesPlayed, json.profile.gamesPlayed || 0),
        unlockedSaberColors: (json.profile.unlockedSaberColors as SaberColor[]) || data.unlockedSaberColors,
        selectedSaberColor: (json.profile.selectedSaberColor as SaberColor) || data.selectedSaberColor,
        updatedAt: json.profile.updatedAt,
      };
      saveLocal(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Cloud sync error (fallback to local):', err);
  }
  return data;
}

export async function fetchFromCloud(syncCode: string): Promise<UserSaveData | null> {
  const code = syncCode.toUpperCase().trim();
  if (!code) return null;

  try {
    const res = await fetch(`/api/cloud-save/${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.profile) {
      const p = json.profile;
      const loaded: UserSaveData = {
        syncCode: p.syncCode,
        playerName: p.playerName || 'CyberSaber',
        highScore: p.highScore || 0,
        maxCombo: p.maxCombo || 0,
        totalKills: p.totalKills || 0,
        bossKills: p.bossKills || 0,
        gamesPlayed: p.gamesPlayed || 0,
        unlockedSaberColors: (p.unlockedSaberColors as SaberColor[]) || ['cyan'],
        selectedSaberColor: (p.selectedSaberColor as SaberColor) || 'cyan',
        audioVolume: 0.7,
        isMuted: false,
        quality: 'AUTO',
        difficulty: p.difficulty || 'NORMAL',
        updatedAt: p.updatedAt,
      };
      saveLocal(loaded);
      return loaded;
    }
  } catch (err) {
    console.warn('Error fetching cloud profile:', err);
  }
  return null;
}

export async function fetchLeaderboard(options?: {
  timeframe?: 'all' | 'week' | 'today';
  search?: string;
}): Promise<LeaderboardEntry[]> {
  try {
    const params = new URLSearchParams();
    if (options?.timeframe) params.set('timeframe', options.timeframe);
    if (options?.search) params.set('search', options.search);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`/api/leaderboard${qs}`);
    if (!res.ok) throw new Error('Leaderboard fetch error');
    const json = await res.json();
    if (json.success && Array.isArray(json.scores)) {
      return json.scores;
    }
  } catch (err) {
    console.warn('Failed to load online leaderboard, using local records:', err);
  }
  return [];
}

export async function submitScoreToLeaderboard(entry: {
  playerName: string;
  score: number;
  maxCombo: number;
  stageReached: number;
  bossesDefeated: number;
  totalKills: number;
  saberActiveTime: number;
}): Promise<{ success: boolean; rank?: number }> {
  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) return { success: false };
    const json = await res.json();
    return { success: true, rank: json.rank };
  } catch (err) {
    console.warn('Score submission error:', err);
    return { success: false };
  }
}
