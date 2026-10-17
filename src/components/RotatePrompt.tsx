import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, X } from 'lucide-react';

export const RotatePrompt: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if mobile device and in portrait mode
      const isMobile =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 840;

      const isVertical = window.innerHeight > window.innerWidth;
      setIsPortrait(isMobile && isVertical);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-fade-in select-none">
      <div className="max-w-xs text-center space-y-4">
        {/* Animated Rotating Phone Graphic */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-xl animate-pulse" />
          <div className="relative p-4 bg-slate-900 border border-cyan-500/50 rounded-2xl shadow-2xl text-cyan-400 animate-bounce">
            <Smartphone className="w-12 h-12 rotate-90 transition-transform duration-700" />
          </div>
          <RotateCw className="w-6 h-6 text-pink-400 absolute -top-1 -right-1 animate-spin" />
        </div>

        <div>
          <h3 className="text-lg font-black text-white tracking-wider">
            LÜTFEN EKRANI YATAY ÇEVİRİN
          </h3>
          <p className="text-xs font-mono text-cyan-400 mt-1 uppercase tracking-wider">
            Rotate Device to Landscape
          </p>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          En iyi 2D çöp adam aksiyon deneyimi ve rahat 4 tuşlu dokunmatik kontroller için lütfen telefonunuzu yatay (landscape) konuma getiriniz.
        </p>

        <button
          onClick={() => setDismissed(true)}
          className="mt-2 py-2 px-5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
        >
          Yine de Devam Et / Dismiss
        </button>
      </div>
    </div>
  );
};
