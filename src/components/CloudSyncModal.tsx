import React, { useState } from 'react';
import { UserSaveData } from '../types/game';
import { syncToCloud, fetchFromCloud } from '../services/cloudStorage';
import { Cloud, Copy, Check, Download, Upload, X, Monitor } from 'lucide-react';

interface CloudSyncModalProps {
  saveData: UserSaveData;
  onUpdateSave: (newData: UserSaveData) => void;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ saveData, onUpdateSave, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(saveData.syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloudBackup = async () => {
    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const updated = await syncToCloud(saveData);
      if (updated) {
        onUpdateSave(updated);
        setStatusMsg({ text: 'Game save successfully backed up to cloud!' });
      } else {
        setStatusMsg({ text: 'Could not connect to cloud. Saved locally.', isError: true });
      }
    } catch {
      setStatusMsg({ text: 'Error occurred during backup.', isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) return;

    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const imported = await fetchFromCloud(cleanCode);
      if (imported) {
        onUpdateSave(imported);
        setStatusMsg({ text: `Profile [${cleanCode}] successfully synced to this device!` });
        setInputCode('');
      } else {
        setStatusMsg({ text: 'Cloud save not found for this code. Please verify.', isError: true });
      }
    } catch {
      setStatusMsg({ text: 'Error occurred during sync.', isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/50 rounded-xl text-cyan-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">CROSS-DEVICE CLOUD SYNC</h2>
              <p className="text-xs text-slate-400">Seamlessly sync high scores and unlocked blades across devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Status Alert */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                statusMsg.isError
                  ? 'bg-red-950/60 border border-red-800/80 text-red-300'
                  : 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          {/* Device Sync Code Display */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center justify-between">
              <span>YOUR DEVICE SYNC CODE</span>
              <span className="text-[10px] text-cyan-400 font-mono">Cross-Platform Key</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl py-2 px-3 font-mono font-black text-lg text-cyan-300 tracking-wider text-center select-all">
                {saveData.syncCode}
              </div>
              <button
                onClick={handleCopy}
                className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <Monitor className="w-3.5 h-3.5 shrink-0" />
              <span>Enter this key on any mobile phone, tablet, or other PC to sync progress.</span>
            </p>
          </div>

          {/* Sync Stats Overview */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900/50 border border-slate-800/80 p-2.5 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">HIGH SCORE</div>
              <div className="text-base font-black text-cyan-400 font-mono tabular-nums">
                {saveData.highScore.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 p-2.5 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">MAX COMBO</div>
              <div className="text-base font-black text-purple-400 font-mono tabular-nums">
                {saveData.maxCombo}x
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 p-2.5 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">BOSS DEFEATS</div>
              <div className="text-base font-black text-amber-400 font-mono tabular-nums">
                {saveData.bossKills}
              </div>
            </div>
          </div>

          {/* Import Code Form */}
          <form onSubmit={handleImportCode} className="space-y-2">
            <label className="text-xs text-slate-300 font-semibold block">
              Import Save Data from Another Device:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. CYBER-77"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSyncing || !inputCode.trim()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Import</span>
              </button>
            </div>
          </form>

          {/* Direct Backup Trigger */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={handleCloudBackup}
              disabled={isSyncing}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>{isSyncing ? 'Syncing...' : 'Backup to Cloud Now'}</span>
            </button>
            <span className="text-[10px] text-slate-500">
              Updated: {new Date(saveData.updatedAt).toLocaleTimeString('en-US')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
