import React from 'react';
import { SlashType } from '../types/game';
import { ArrowLeft, ArrowRight, ArrowUp, Zap } from 'lucide-react';

interface TouchControlsProps {
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onSlash: (type: 'C' | 'X' | 'Z') => void;
  onCombo: (type: SlashType) => void;
  isUltimateReady: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onJumpStart,
  onJumpEnd,
  onSlash,
  onCombo,
  isUltimateReady,
}) => {
  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none p-3 pb-5 flex justify-between items-end select-none">
      {/* Left Touch: Quick Directional / Arrow Controls */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))}
          onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }))}
          onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))}
          onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }))}
          className="w-13 h-13 rounded-2xl bg-slate-900/80 active:bg-cyan-950/80 border border-slate-700/80 active:border-cyan-400 flex items-center justify-center text-slate-300 active:text-cyan-400 shadow-xl active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))}
          onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }))}
          onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))}
          onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }))}
          className="w-13 h-13 rounded-2xl bg-slate-900/80 active:bg-cyan-950/80 border border-slate-700/80 active:border-cyan-400 flex items-center justify-center text-slate-300 active:text-cyan-400 shadow-xl active:scale-95 transition-transform"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Right Touch: Jump & Lightsaber Slashes (C, X, Z) + Combos */}
      <div className="flex flex-col items-end gap-2 pointer-events-auto">
        {/* Quick Multi-key Combo row */}
        <div className="flex gap-1.5 mb-1">
          <button
            onClick={() => onCombo('COMBO_XC')}
            className="px-2.5 py-1.5 bg-slate-900/85 active:bg-purple-900/90 border border-purple-500/60 rounded-xl text-[11px] font-bold text-purple-300 shadow active:scale-95 transition-transform"
          >
            XC Vortex
          </button>
          <button
            onClick={() => onCombo('COMBO_XZ')}
            className="px-2.5 py-1.5 bg-slate-900/85 active:bg-cyan-900/90 border border-cyan-500/60 rounded-xl text-[11px] font-bold text-cyan-300 shadow active:scale-95 transition-transform"
          >
            XZ Dash
          </button>
          <button
            onClick={() => onCombo('ULTIMATE_ZXC')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black tracking-wider shadow active:scale-95 transition-all flex items-center gap-1 ${
              isUltimateReady
                ? 'bg-gradient-to-r from-pink-600 to-cyan-600 text-white border border-pink-400 animate-pulse'
                : 'bg-slate-900/60 border border-slate-800 text-slate-500'
            }`}
          >
            <Zap className="w-3 h-3" />
            ZXC ULTIMATE
          </button>
        </div>

        {/* Main Action Buttons Grid */}
        <div className="flex items-center gap-2">
          {/* Slashes Cluster: C, X, Z */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onTouchStart={() => onSlash('C')}
              onClick={() => onSlash('C')}
              className="w-13 h-13 rounded-2xl bg-cyan-950/80 active:bg-cyan-800 border border-cyan-500/80 active:border-cyan-300 flex flex-col items-center justify-center text-cyan-300 shadow-xl active:scale-95 transition-transform"
            >
              <span className="text-base font-extrabold leading-none">C</span>
              <span className="text-[9px] text-cyan-400/80">Up</span>
            </button>

            <button
              onTouchStart={() => onSlash('X')}
              onClick={() => onSlash('X')}
              className="w-13 h-13 rounded-2xl bg-cyan-950/80 active:bg-cyan-800 border border-cyan-500/80 active:border-cyan-300 flex flex-col items-center justify-center text-cyan-300 shadow-xl active:scale-95 transition-transform"
            >
              <span className="text-base font-extrabold leading-none">X</span>
              <span className="text-[9px] text-cyan-400/80">Mid</span>
            </button>

            <button
              onTouchStart={() => onSlash('Z')}
              onClick={() => onSlash('Z')}
              className="w-13 h-13 rounded-2xl bg-cyan-950/80 active:bg-cyan-800 border border-cyan-500/80 active:border-cyan-300 flex flex-col items-center justify-center text-cyan-300 shadow-xl active:scale-95 transition-transform"
            >
              <span className="text-base font-extrabold leading-none">Z</span>
              <span className="text-[9px] text-cyan-400/80">Down</span>
            </button>
          </div>

          {/* Single-touch Jump Button */}
          <button
            onTouchStart={onJumpStart}
            onTouchEnd={onJumpEnd}
            onMouseDown={onJumpStart}
            onMouseUp={onJumpEnd}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 active:from-cyan-400 active:to-blue-400 border border-cyan-300/80 flex flex-col items-center justify-center text-white shadow-2xl active:scale-95 transition-transform"
          >
            <ArrowUp className="w-6 h-6 stroke-[3]" />
            <span className="text-[10px] font-black tracking-wider">JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
