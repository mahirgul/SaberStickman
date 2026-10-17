import React from 'react';
import { GraphicQuality } from '../types/game';
import { Play, RotateCcw, Home, Volume2, VolumeX, Activity, RefreshCw } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onOpenRefreshPage?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  quality: GraphicQuality;
  onSelectQuality: (q: GraphicQuality) => void;
  fps: number;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  onOpenRefreshPage,
  isMuted,
  onToggleMute,
  quality,
  onSelectQuality,
  fps,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4">
        <h2 className="text-xl font-black text-white tracking-wider">GAME PAUSED</h2>

        {/* Settings row */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Music & Sound FX</span>
            <button
              onClick={onToggleMute}
              className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 text-cyan-400 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Graphics ({fps} FPS):</span>
            </span>
            <div className="flex gap-1">
              {(['AUTO', 'HIGH', 'LOW'] as GraphicQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => onSelectQuality(q)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    quality === q
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {q === 'AUTO' ? 'Auto' : q === 'HIGH' ? 'High' : 'Eco'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl text-xs font-black tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>RESUME</span>
          </button>
          <button
            onClick={onRestart}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Run</span>
          </button>
          <button
            onClick={onHome}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Title Menu</span>
          </button>

          {onOpenRefreshPage && (
            <button
              onClick={onOpenRefreshPage}
              className="w-full py-2.5 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Yenileme Sayfası (Refresh / Cache)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
