import React from 'react';
import { GameStats, PlayerState, Enemy, GraphicQuality } from '../types/game';
import { SABER_MAX_TIME } from '../game/constants';
import { Volume2, VolumeX, Pause, Sparkles, Activity } from 'lucide-react';

interface GameHUDProps {
  stats: GameStats;
  player: PlayerState;
  boss: Enemy | null;
  fps: number;
  quality: GraphicQuality;
  isLowQualityActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onToggleQuality: () => void;
  onTriggerUltimate?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  player,
  boss,
  fps,
  quality,
  isLowQualityActive,
  isMuted,
  onToggleMute,
  onPause,
  onToggleQuality,
  onTriggerUltimate,
}) => {
  const saberPct = Math.min(1, Math.max(0, player.saberTimer / SABER_MAX_TIME));
  const isSaberLow = player.saberTimer <= 10 && player.saberActive;
  const isSaberCritical = player.saberTimer <= 5 && player.saberActive;

  const energyPct = Math.min(100, Math.max(0, player.energy));
  const isUltimateReady = energyPct >= 75;

  const getComboTitle = (c: number) => {
    if (c >= 40) return 'GODLIKE!';
    if (c >= 25) return 'ULTRA!';
    if (c >= 15) return 'HYPER!';
    if (c >= 8) return 'GREAT!';
    if (c >= 3) return 'GOOD!';
    return '';
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden p-3 md:p-6 flex flex-col justify-between">
      {/* Top Bar: Status Clusters, Boss Bar & Lightsaber Gauge */}
      <div className="flex items-start justify-between gap-4">
        {/* Left Cluster: Health & Energy */}
        <div className="flex flex-col gap-2 bg-slate-950/80 backdrop-blur-md p-3 rounded-xl border border-slate-800/80 shadow-2xl min-w-[200px] md:min-w-[240px]">
          {/* Health Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1 font-semibold">
              <span className="text-slate-400">HEALTH (HP)</span>
              <span className="font-mono text-emerald-400 tabular-nums">
                {Math.round(player.health)} / {player.maxHealth}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-150"
                style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
              />
            </div>
          </div>

          {/* Energy Bar (Fills rapidly with combo strikes) */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1 font-semibold">
              <span className="text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> ENERGY
              </span>
              <span className="font-mono text-cyan-300 tabular-nums">{Math.round(energyPct)}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  isUltimateReady
                    ? 'bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-300 animate-pulse'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${energyPct}%` }}
              />
            </div>
          </div>

          {/* Ultimate Ready Action Button */}
          {isUltimateReady && onTriggerUltimate && (
            <button
              onClick={onTriggerUltimate}
              className="pointer-events-auto mt-1 py-1 px-2.5 bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 text-white text-[11px] font-bold rounded-lg tracking-wider text-center transition-transform active:scale-95 shadow-lg shadow-pink-500/20"
            >
              [XCV] ULTIMATE READY!
            </button>
          )}
        </div>

        {/* Center: Boss Bar or Distance & Score HUD */}
        {boss && boss.state !== 'DEAD' ? (
          <div className="flex-1 max-w-md mx-2 bg-slate-950/90 border border-red-500/50 p-3 rounded-xl shadow-2xl flex flex-col items-center animate-fade-in">
            <div className="flex justify-between w-full text-xs font-bold text-red-400 mb-1">
              <span className="tracking-widest">{boss.name}</span>
              <span className="font-mono tabular-nums">
                {Math.max(0, Math.round(boss.health))} / {boss.maxHealth}
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-red-950">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-full transition-all duration-100"
                style={{ width: `${(Math.max(0, boss.health) / boss.maxHealth) * 100}%` }}
              />
            </div>

            {/* Boss Stun Status */}
            {boss.state === 'STUNNED' ? (
              <span className="text-[11px] font-bold text-amber-400 mt-1 animate-bounce">
                ★ BOSS STUNNED! 2X CRITICAL DAMAGE! ★
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 mt-0.5">
                Stun boss with combos (XC, CV, or XCV Ultimate)
              </span>
            )}
          </div>
        ) : (
          /* Normal Distance & Score cluster */
          <div className="flex items-center gap-6 bg-slate-950/70 border border-slate-800/80 px-4 py-2 rounded-xl backdrop-blur-md">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">SCORE</div>
              <div className="text-xl md:text-2xl font-extrabold text-cyan-300 font-mono tabular-nums">
                {stats.score.toLocaleString()}
              </div>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">DISTANCE</div>
              <div className="text-lg md:text-xl font-bold text-slate-200 font-mono tabular-nums">
                {stats.distance}m
              </div>
            </div>
          </div>
        )}

        {/* Right Corner: Lightsaber Timer & Controls Cluster */}
        <div className="flex items-start gap-3">
          {/* Lightsaber Corner Circular / Gauge Timer */}
          <div
            className={`p-3 rounded-2xl border shadow-2xl flex items-center gap-3 transition-colors ${
              !player.saberActive
                ? 'bg-red-950/40 border-red-800/60'
                : isSaberCritical
                ? 'bg-red-950/80 border-red-500 animate-pulse'
                : isSaberLow
                ? 'bg-amber-950/70 border-amber-500/80'
                : 'bg-slate-950/80 border-cyan-500/60'
            }`}
          >
            {/* Circular Gauge SVG */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className="stroke-slate-800 fill-none"
                  strokeWidth="4"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className={`fill-none transition-all duration-150 ${
                    !player.saberActive
                      ? 'stroke-slate-700'
                      : isSaberCritical
                      ? 'stroke-red-500'
                      : isSaberLow
                      ? 'stroke-amber-400'
                      : 'stroke-cyan-400'
                  }`}
                  strokeWidth="4"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 * (1 - saberPct)}
                  strokeLinecap="round"
                />
              </svg>
              <span
                className={`absolute text-xs font-extrabold font-mono tabular-nums ${
                  !player.saberActive
                    ? 'text-red-400'
                    : isSaberCritical
                    ? 'text-red-400'
                    : isSaberLow
                    ? 'text-amber-300'
                    : 'text-cyan-300'
                }`}
              >
                {Math.ceil(player.saberTimer)}s
              </span>
            </div>

            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                SABER DURATION
              </div>
              <div
                className={`text-sm font-extrabold ${
                  !player.saberActive
                    ? 'text-red-500'
                    : isSaberCritical
                    ? 'text-red-400'
                    : isSaberLow
                    ? 'text-amber-300'
                    : 'text-cyan-400'
                }`}
              >
                {player.saberActive
                  ? `${player.saberTimer.toFixed(1)}s (Max 60s)`
                  : 'NO SABER! EVADE!'}
              </div>
              <div className="text-[10px] text-slate-500">
                {player.saberActive ? 'Pick up +5s sabers' : 'Find saber on ground'}
              </div>
            </div>
          </div>

          {/* Quick HUD Action Buttons */}
          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <button
              onClick={onToggleMute}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors shadow"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <button
              onClick={onPause}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors shadow"
              title="Pause (P / Esc)"
            >
              <Pause className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleQuality}
              className={`p-1.5 text-[10px] font-mono rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                isLowQualityActive
                  ? 'bg-amber-950/80 border-amber-600/60 text-amber-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Graphics Quality / FPS Monitor"
            >
              <Activity className="w-3 h-3" />
              <span>{fps} FPS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Middle Floating Combo Counter */}
      {stats.combo > 1 && (
        <div className="self-start mt-4 bg-slate-950/85 border border-pink-500/60 p-3 rounded-2xl backdrop-blur-md shadow-2xl flex items-center gap-3 animate-pulse">
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 font-mono tabular-nums">
            x{stats.combo}
          </div>
          <div>
            <div className="text-xs font-black tracking-widest text-pink-400">
              {getComboTitle(stats.combo)} COMBO!
            </div>
            <div className="text-[11px] font-mono text-cyan-300">
              {stats.comboMultiplier.toFixed(2)}x Damage & Score
            </div>
          </div>
        </div>
      )}

      {/* Low Quality Alert Notification (if auto-adjusted below 30 fps) */}
      {isLowQualityActive && (
        <div className="self-center bg-slate-900/90 border border-amber-500/50 px-3 py-1 rounded-full text-xs text-amber-300 shadow">
          Performance Mode Active (Low FPS detected · Visuals optimized for smoothness)
        </div>
      )}

      {/* Bottom Keyboard Controls Reference Line with X, C, V Keys */}
      <div className="hidden md:flex justify-center items-center gap-4 text-xs text-slate-400 bg-slate-950/60 border border-slate-900 px-4 py-1.5 rounded-full mx-auto backdrop-blur-sm">
        <span><strong className="text-slate-200">← → / A D</strong> Move</span>
        <span>·</span>
        <span><strong className="text-slate-200">Space / ↑</strong> Jump</span>
        <span>·</span>
        <span><strong className="text-cyan-400">X</strong> Down Slash</span>
        <span>·</span>
        <span><strong className="text-cyan-400">C</strong> Mid Slash</span>
        <span>·</span>
        <span><strong className="text-cyan-400">V</strong> Up Slash</span>
        <span>·</span>
        <span><strong className="text-pink-400">XC / CV / XV</strong> Combos</span>
        <span>·</span>
        <span><strong className="text-pink-400">XCV</strong> Ultimate Cleave</span>
      </div>
    </div>
  );
};
