import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types/game';
import { fetchLeaderboard } from '../services/cloudStorage';
import { Trophy, X, Search, RotateCw, Calendar, Flame, Zap } from 'lucide-react';

interface LeaderboardModalProps {
  onClose: () => void;
  currentPlayerName?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose, currentPlayerName }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'week' | 'today'>('all');
  const [search, setSearch] = useState('');

  const loadData = () => {
    setLoading(true);
    fetchLeaderboard({ timeframe, search }).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/50 rounded-xl text-cyan-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>GLOBAL LEADERBOARD</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                  LIVE CLOUD
                </span>
              </h2>
              <p className="text-xs text-slate-400">Real-time synchronized worldwide rankings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          {/* Timeframe Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All-Time
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                timeframe === 'week'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                timeframe === 'today'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
          </div>

          {/* Search Input & Refresh Button */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search player..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none w-36 sm:w-44"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            </form>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Leaderboard"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <RotateCw className="w-5 h-5 animate-spin text-cyan-400" />
              <span>Fetching live global scores...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              No entries found for this filter. Be the first to place on the board!
            </div>
          ) : (
            entries.map((item, index) => {
              const isTop3 = index < 3;
              const isCurrent =
                currentPlayerName &&
                item.playerName.toLowerCase() === currentPlayerName.toLowerCase();

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500/70 shadow-lg shadow-cyan-950/40 scale-[1.01]'
                      : isTop3
                      ? 'bg-slate-900/80 border-slate-700/80'
                      : 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Rank & Name */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-sm shrink-0 ${
                        index === 0
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : index === 1
                          ? 'bg-slate-400/20 text-slate-300 border border-slate-400/50'
                          : index === 2
                          ? 'bg-amber-800/20 text-amber-600 border border-amber-700/50'
                          : 'text-slate-500 bg-slate-900/80'
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{item.playerName}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/40 font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                        <span className="flex items-center gap-1 text-purple-300">
                          <Flame className="w-3 h-3" /> {item.maxCombo}x Combo
                        </span>
                        <span>·</span>
                        <span>Bosses: {item.bossesDefeated}</span>
                        <span>·</span>
                        <span>Saber: {Math.round(item.saberActiveTime)}s</span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-cyan-400 font-mono tabular-nums">
                      {item.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {entries.length} players ranked · Auto-updated
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
