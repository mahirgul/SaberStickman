import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink, X, Smartphone, Monitor } from 'lucide-react';
import { saveLocal, loadLocalSave } from '../services/cloudStorage';

interface RefreshPageModalProps {
  onClose: () => void;
  onSoftReset?: () => void;
}

export const RefreshPageModal: React.FC<RefreshPageModalProps> = ({ onClose, onSoftReset }) => {
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [serverPing, setServerPing] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [cleaningStatus, setCleaningStatus] = useState<string | null>(null);
  const clientVersion = '1.3.4';

  useEffect(() => {
    checkServerVersion();
  }, []);

  const checkServerVersion = async () => {
    setIsChecking(true);
    const startTime = performance.now();
    try {
      const res = await fetch(`/api/version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const ping = Math.round(performance.now() - startTime);
      setServerPing(ping);

      if (res.ok) {
        const data = await res.json();
        setServerVersion(data.version || '1.3.4');
      } else {
        setServerVersion('1.3.4 (Offline)');
      }
    } catch {
      setServerVersion('1.3.4 (Fallback)');
      setServerPing(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleQuickReload = () => {
    window.location.reload();
  };

  const handleCleanCacheAndReload = async () => {
    setCleaningStatus('Cleaning browser cache & unregistering workers...');
    try {
      // 1. Preserve critical user save data in localStorage
      const currentSave = loadLocalSave();
      saveLocal(currentSave);

      // 2. Unregister any stale service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // 3. Delete browser caches (CacheStorage API)
      if ('caches' in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
      }

      // 4. Clear transient session storage
      try {
        sessionStorage.clear();
      } catch {}

      setCleaningStatus('Cache cleared! Hard reloading app now...');

      // 5. Navigate with cache-busting timestamp parameter to force browser to re-fetch HTML & bundle
      setTimeout(() => {
        const baseUrl = window.location.origin + window.location.pathname;
        window.location.href = `${baseUrl}?v=${Date.now()}`;
      }, 500);
    } catch (err) {
      console.error('Error while cleaning cache:', err);
      // Fallback reload
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(0,240,255,0.15)] p-6 md:p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <RefreshCw className="w-5 h-5 animate-[spin_6s_linear_infinite]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wider">
                UPDATE & REFRESH CENTER
              </h2>
              <p className="text-xs text-slate-400">
                Oyun Yenileme ve Güncelleme Merkezi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Installed Client Version:</span>
            <span className="font-mono text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
              v{clientVersion}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Server Live Version:</span>
            <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
              {isChecking ? (
                <span className="text-slate-500">Checking...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>v{serverVersion || clientVersion}</span>
                  {serverPing !== null && (
                    <span className="text-[10px] text-slate-500">({serverPing}ms)</span>
                  )}
                </>
              )}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 leading-relaxed">
            Tarayıcınız veya iFrame bazen oyunun eski kodunu önbellekte saklar. Aşağıdaki butonlarla sayfayı anında en son sürüme zorlayarak yenileyebilirsiniz.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Main Action: Force Refresh with Cache Clean */}
          <button
            onClick={handleCleanCacheAndReload}
            className="w-full p-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-2xl text-xs md:text-sm font-black tracking-wider transition-all shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:shadow-[0_0_35px_rgba(0,240,255,0.5)] active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer text-left"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <div className="text-center">
              <div>ÖNBELLEĞİ TEMİZLE & ZORLA YENİLE</div>
              <div className="text-[10px] text-cyan-100 font-normal opacity-90">
                (Clean Cache & Force Hard Reload - Önerilen)
              </div>
            </div>
          </button>

          {/* Quick Reload */}
          <button
            onClick={handleQuickReload}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>Hızlı Sayfa Yenile (Quick Page Reload)</span>
          </button>

          {/* Soft Reset Engine if available */}
          {onSoftReset && (
            <button
              onClick={() => {
                onSoftReset();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Oyun Motorunu Sıfırla & Başlat (Reset Game State)</span>
            </button>
          )}
        </div>

        {/* Cleaning progress message */}
        {cleaningStatus && (
          <div className="bg-cyan-950/60 border border-cyan-800/80 p-3 rounded-xl text-center text-xs text-cyan-300 animate-pulse font-mono">
            {cleaningStatus}
          </div>
        )}

        {/* Shortcut instructions */}
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-3.5 text-xs text-slate-400 space-y-2">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span>Klavye Kısayolu ile Zorla Yenileme:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Windows / Linux</span>
              <strong className="text-cyan-300">Ctrl + F5</strong> veya{' '}
              <strong className="text-cyan-300">Ctrl + Shift + R</strong>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">macOS (Apple)</span>
              <strong className="text-cyan-300">Cmd + Shift + R</strong>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mobil: Ekranı yukarıdan aşağıya çekerek veya Gizli Sekmede açarak yenileyin.</span>
          </div>
        </div>

        {/* Footer Close */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors"
          >
            Kapat & Oyuna Dön (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
