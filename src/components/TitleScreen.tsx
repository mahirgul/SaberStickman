import React from 'react';
import { UserSaveData, SaberColor, DifficultyMode } from '../types/game';
import { SABER_COLORS, DIFFICULTY_CONFIGS } from '../game/constants';
import { Play, Trophy, Cloud, Volume2, VolumeX, Sparkles, RefreshCw, Zap, Shield, Flame, Infinity } from 'lucide-react';

interface TitleScreenProps {
  saveData: UserSaveData;
  onStart: () => void;
  onOpenLeaderboard: () => void;
  onOpenCloudSync: () => void;
  onOpenRefreshPage: () => void;
  onSelectSaberColor: (color: SaberColor) => void;
  onSelectDifficulty: (diff: DifficultyMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  saveData,
  onStart,
  onOpenLeaderboard,
  onOpenCloudSync,
  onOpenRefreshPage,
  onSelectSaberColor,
  onSelectDifficulty,
  isMuted,
  onToggleMute,
}) => {
  const currentSaber =
    SABER_COLORS.find((c) => c.id === saveData.selectedSaberColor) || SABER_COLORS[0];
  const currentDifficulty = saveData.difficulty || 'NORMAL';

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 md:p-8 overflow-y-auto select-none bg-gradient-to-b from-slate-950/80 via-slate-950/95 to-slate-950">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3 max-w-5xl mx-auto w-full">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold tracking-wider text-xs sm:text-sm text-slate-200 uppercase font-mono">
            CYBER ARCADE
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Dedicated Refresh / Update Center Button */}
          <button
            onClick={onOpenRefreshPage}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/50 rounded-xl text-xs font-semibold text-cyan-300 transition-all shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] cursor-pointer"
            title="Oyun Yenileme ve Güncelleme Merkezi (Refresh / Clear Cache)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-[spin_8s_linear_infinite]" />
            <span className="hidden sm:inline">Yenile</span>
            <span className="text-[10px] bg-cyan-500/25 px-1.5 py-0.5 rounded font-mono text-cyan-200">v1.3.4</span>
          </button>

          <button
            onClick={onOpenCloudSync}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 transition-colors shadow"
          >
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Cloud Sync</span>
            <span className="sm:hidden">Sync</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 transition-colors shadow"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Leaderboard</span>
            <span className="sm:hidden">Scores</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 transition-colors shadow"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke Title Lockup */}
      <div className="max-w-3xl mx-auto w-full text-center my-auto py-4">
        {/* Bespoke Inline SVG Logo */}
        <div className="flex justify-center mb-2">
          <svg
            viewBox="0 0 540 100"
            className="w-full max-w-lg h-auto drop-shadow-[0_0_25px_rgba(0,240,255,0.4)]"
          >
            <defs>
              <linearGradient id="neonTitleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ff007f" />
              </linearGradient>
            </defs>
            <text
              x="50%"
              y="50"
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-black tracking-widest fill-transparent"
              stroke="url(#neonTitleGrad)"
              strokeWidth="3.2"
              fontFamily="Outfit, sans-serif"
              fontSize="44"
              fontWeight="900"
            >
              SABER STICKMAN
            </text>
            <text
              x="50%"
              y="85"
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-mono tracking-[0.35em] fill-cyan-400"
              fontSize="16"
              fontWeight="700"
            >
              — NEON EDGE —
            </text>
          </svg>
        </div>

        <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed mb-4">
          Ground lightsabers extend your blade! Attack with <strong className="text-cyan-300">X</strong> (Down), <strong className="text-cyan-300">C</strong> (Mid), and <strong className="text-cyan-300">V</strong> (Up) slashes (German QWERTZ / Standard) or combo <strong className="text-pink-400">XCV</strong> for ultimate boss stuns!
        </p>

        {/* Difficulty & Saber Mode Selector */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 max-w-xl mx-auto mb-4 text-left">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Lightsaber Duration & Difficulty:</span>
            </span>
            <span className="text-[11px] text-cyan-400 font-mono">
              {DIFFICULTY_CONFIGS[currentDifficulty].name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['CASUAL', 'NORMAL', 'HARDCORE', 'INFINITE'] as DifficultyMode[]).map((mode) => {
              const cfg = DIFFICULTY_CONFIGS[mode];
              const isSelected = currentDifficulty === mode;

              return (
                <button
                  key={mode}
                  onClick={() => onSelectDifficulty(mode)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)] text-white'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold leading-none">{cfg.name.split(' ')[0]}</span>
                    {mode === 'INFINITE' ? (
                      <Infinity className="w-3.5 h-3.5 text-pink-400" />
                    ) : mode === 'CASUAL' ? (
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    ) : mode === 'HARDCORE' ? (
                      <Flame className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300 font-semibold">{cfg.badge}</div>
                  <div className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{cfg.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Start CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-base tracking-wider rounded-2xl shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:shadow-[0_0_45px_rgba(0,240,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>START GAME</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 mt-2 font-mono">
          Press [SPACE], [ENTER], or [UP ARROW] to begin
        </div>

        {/* Saber Crystal Selector */}
        <div className="mt-4 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl max-w-lg mx-auto">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Saber Crystal Blade:</span>
            </span>
            <span className="font-mono text-cyan-300 text-[11px]">{currentSaber.name}</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            {SABER_COLORS.map((cfg) => {
              const isUnlocked = saveData.highScore >= cfg.unlockScore;
              const isSelected = saveData.selectedSaberColor === cfg.id;

              return (
                <button
                  key={cfg.id}
                  disabled={!isUnlocked}
                  onClick={() => onSelectSaberColor(cfg.id)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? 'ring-2 ring-white scale-110 shadow-lg'
                      : isUnlocked
                      ? 'opacity-85 hover:opacity-100 hover:scale-105'
                      : 'opacity-35 cursor-not-allowed'
                  }`}
                  style={{
                    backgroundColor: cfg.bladeColor,
                    boxShadow: isSelected ? `0 0 16px ${cfg.bladeColor}` : undefined,
                  }}
                  title={
                    isUnlocked
                      ? cfg.name
                      : `${cfg.name} (Requires ${cfg.unlockScore.toLocaleString()} points)`
                  }
                >
                  {isSelected && <span className="w-2 h-2 bg-white rounded-full shadow" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="max-w-4xl mx-auto w-full text-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800/80 px-4 py-1.5 rounded-full">
          <span><strong className="text-slate-200">← → / A D</strong> Move</span>
          <span>·</span>
          <span><strong className="text-slate-200">Space / ↑</strong> Jump</span>
          <span>·</span>
          <span><strong className="text-cyan-400">X</strong> Down · <strong className="text-cyan-400">C</strong> Mid · <strong className="text-cyan-400">V</strong> Up</span>
          <span>·</span>
          <span><strong className="text-pink-400">XCV</strong> Ultimate</span>
          <span>·</span>
          <span><strong className="text-slate-200">Mobile</strong> Left: [←][→] · Right: [Attack][Jump]</span>
          <span>·</span>
          <button
            onClick={onOpenRefreshPage}
            className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Yenileme Sayfası</span>
          </button>
        </div>
      </div>
    </div>
  );
};
