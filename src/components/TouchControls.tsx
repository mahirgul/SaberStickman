import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Sword, Zap } from 'lucide-react';

interface TouchControlsProps {
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onAttack: () => void;
  onMoveLeftStart: () => void;
  onMoveLeftEnd: () => void;
  onMoveRightStart: () => void;
  onMoveRightEnd: () => void;
  isUltimateReady: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onJumpStart,
  onJumpEnd,
  onAttack,
  onMoveLeftStart,
  onMoveLeftEnd,
  onMoveRightStart,
  onMoveRightEnd,
  isUltimateReady,
}) => {
  const triggerHaptic = (ms: number = 12) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none p-4 pb-6 flex justify-between items-end select-none z-30">
      {/* EKRANIN SOLUNDA 2 TUŞ: İLERİ VE GERİ */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* 1. GERİ TUŞU (LEFT / BACK) */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            triggerHaptic(10);
            onMoveLeftStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onMoveLeftEnd();
          }}
          onMouseDown={() => onMoveLeftStart()}
          onMouseUp={() => onMoveLeftEnd()}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-950/75 active:bg-cyan-950/90 border-2 border-slate-700/80 active:border-cyan-400 flex flex-col items-center justify-center text-slate-300 active:text-cyan-300 shadow-2xl active:scale-95 transition-all backdrop-blur-md cursor-pointer"
          aria-label="Geri Git / Move Left"
        >
          <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">GERİ</span>
        </button>

        {/* 2. İLERİ TUŞU (RIGHT / FORWARD) */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            triggerHaptic(10);
            onMoveRightStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onMoveRightEnd();
          }}
          onMouseDown={() => onMoveRightStart()}
          onMouseUp={() => onMoveRightEnd()}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-950/75 active:bg-cyan-950/90 border-2 border-slate-700/80 active:border-cyan-400 flex flex-col items-center justify-center text-slate-300 active:text-cyan-300 shadow-2xl active:scale-95 transition-all backdrop-blur-md cursor-pointer"
          aria-label="İleri Git / Move Right"
        >
          <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">İLERİ</span>
        </button>
      </div>

      {/* EKRANIN SAĞINDA 2 TUŞ: SALDIRI VE ZIPLAMA */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* 1. SALDIRI TUŞU (ATTACK / SLASH) */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            triggerHaptic(16);
            onAttack();
          }}
          onClick={() => {
            triggerHaptic(16);
            onAttack();
          }}
          className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all backdrop-blur-md cursor-pointer ${
            isUltimateReady
              ? 'bg-gradient-to-tr from-pink-900/90 via-purple-900/90 to-cyan-900/90 border-pink-400 text-white animate-pulse shadow-[0_0_25px_rgba(236,72,153,0.4)]'
              : 'bg-slate-950/75 active:bg-cyan-900/80 border-cyan-500/80 active:border-cyan-300 text-cyan-300'
          }`}
          aria-label="Saldır / Attack"
        >
          {isUltimateReady ? (
            <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-pink-300 animate-bounce" />
          ) : (
            <Sword className="w-7 h-7 sm:w-8 sm:h-8" />
          )}
          <span className="text-[9px] font-black uppercase tracking-wider">
            {isUltimateReady ? 'ULTIMATE' : 'SALDIRI'}
          </span>
        </button>

        {/* 2. ZIPLAMA TUŞU (JUMP) */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            triggerHaptic(12);
            onJumpStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onJumpEnd();
          }}
          onMouseDown={() => onJumpStart()}
          onMouseUp={() => onJumpEnd()}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-blue-700/80 to-cyan-500/80 active:from-blue-600 active:to-cyan-400 border-2 border-cyan-300 text-white flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all backdrop-blur-md cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          aria-label="Zıpla / Jump"
        >
          <ArrowUp className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.8]" />
          <span className="text-[9px] font-black uppercase tracking-wider">ZIPLA</span>
        </button>
      </div>
    </div>
  );
};
