import React from 'react';
import { UserSaveData, SaberColor } from '../types/game';
import { SABER_COLORS } from '../game/constants';
import { Play, Trophy, Cloud, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  saveData: UserSaveData;
  onStart: () => void;
  onOpenLeaderboard: () => void;
  onOpenCloudSync: () => void;
  onSelectSaberColor: (color: SaberColor) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  saveData,
  onStart,
  onOpenLeaderboard,
  onOpenCloudSync,
  onSelectSaberColor,
  isMuted,
  onToggleMute,
}) => {
  const currentSaber =
    SABER_COLORS.find((c) => c.id === saveData.selectedSaberColor) || SABER_COLORS[0];

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-6 md:p-12 overflow-y-auto select-none bg-gradient-to-b from-slate-950/70 via-slate-950/90 to-slate-950">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto w-full">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold tracking-wider text-sm text-slate-200 uppercase font-mono">
            CYBER ARCADE
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCloudSync}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 transition-colors shadow"
          >
            <Cloud className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Cloud Sync</span>
            <span className="sm:hidden">Sync</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 transition-colors shadow"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
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
      <div className="max-w-3xl mx-auto w-full text-center my-auto py-8">
        {/* Bespoke Inline SVG Logo */}
        <div className="flex justify-center mb-4">
          <svg
            viewBox="0 0 540 100"
            className="w-full max-w-xl h-auto drop-shadow-[0_0_25px_rgba(0,240,255,0.4)]"
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

        <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Collect ground lightsabers to stack <strong className="text-cyan-400">+5s</strong> duration (max 60s)! Slice through cyber enemies with <strong className="text-cyan-300">C</strong>, <strong className="text-cyan-300">X</strong>, and <strong className="text-cyan-300">Z</strong> slashes to build hyper combos and stun massive bosses.
        </p>

        {/* Primary Start CTA Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-lg tracking-wider rounded-2xl shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:shadow-[0_0_45px_rgba(0,240,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>START GAME</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 mt-2 font-mono">
          Press [SPACE], [ENTER], or [UP ARROW] to begin
        </div>

        {/* Saber Crystal Selector */}
        <div className="mt-8 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl max-w-lg mx-auto">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Lightsaber Crystal Blade:</span>
            </span>
            <span className="font-mono text-cyan-300 text-[11px]">{currentSaber.name}</span>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {SABER_COLORS.map((cfg) => {
              const isUnlocked = saveData.highScore >= cfg.unlockScore;
              const isSelected = saveData.selectedSaberColor === cfg.id;

              return (
                <button
                  key={cfg.id}
                  disabled={!isUnlocked}
                  onClick={() => onSelectSaberColor(cfg.id)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
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
                  {isSelected && <span className="w-2.5 h-2.5 bg-white rounded-full shadow" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="max-w-3xl mx-auto w-full text-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 px-5 py-2 rounded-full">
          <span><strong className="text-slate-200">← → / A D</strong> Move</span>
          <span>·</span>
          <span><strong className="text-slate-200">Space / ↑ / W</strong> Jump</span>
          <span>·</span>
          <span><strong className="text-cyan-400">C</strong> Up Slash</span>
          <span>·</span>
          <span><strong className="text-cyan-400">X</strong> Mid Slash</span>
          <span>·</span>
          <span><strong className="text-cyan-400">Z</strong> Down Slash</span>
          <span>·</span>
          <span><strong className="text-pink-400">XC / XZ / CZ</strong> Combos</span>
          <span>·</span>
          <span><strong className="text-pink-400">ZXC</strong> Ultimate Cleave</span>
          <span>·</span>
          <span><strong className="text-slate-200">P / Esc</strong> Pause</span>
        </div>
      </div>
    </div>
  );
};
