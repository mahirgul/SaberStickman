import React, { useState } from 'react';
import { GameStats, UserSaveData } from '../types/game';
import { submitScoreToLeaderboard } from '../services/cloudStorage';
import { RotateCcw, Trophy, CheckCircle, Skull } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  saveData: UserSaveData;
  onRestart: () => void;
  onOpenLeaderboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  saveData,
  onRestart,
  onOpenLeaderboard,
}) => {
  const [playerName, setPlayerName] = useState(saveData.playerName || 'CyberSaber');
  const [submitted, setSubmitted] = useState(false);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNewHighScore = stats.score > saveData.highScore;

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || submitted || isSubmitting) return;

    setIsSubmitting(true);
    const result = await submitScoreToLeaderboard({
      playerName: playerName.trim(),
      score: stats.score,
      maxCombo: stats.maxCombo,
      stageReached: stats.stage,
      bossesDefeated: stats.bossesDefeated,
      totalKills: stats.enemiesKilled,
      saberActiveTime: Math.round(stats.saberTotalActiveSeconds),
    });

    setIsSubmitting(false);
    if (result.success) {
      setSubmitted(true);
      if (result.rank) setSubmittedRank(result.rank);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 text-center border-b border-slate-800/80 bg-gradient-to-b from-red-950/40 to-transparent">
          <div className="w-14 h-14 bg-red-950/80 border border-red-500/60 rounded-2xl mx-auto flex items-center justify-center text-red-400 mb-3 shadow-lg shadow-red-900/30">
            <Skull className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">MISSION FAILED</h2>
          <p className="text-xs text-slate-400 mt-1">
            When your lightsaber depletes, evade enemies or leap over them until you find another!
          </p>
          {isNewHighScore && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs font-bold text-amber-300 animate-pulse">
              <Trophy className="w-3.5 h-3.5" />
              <span>NEW PERSONAL BEST!</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">FINAL SCORE</div>
              <div className="text-2xl font-black text-cyan-400 font-mono tabular-nums">
                {stats.score.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">MAX COMBO</div>
              <div className="text-2xl font-black text-purple-400 font-mono tabular-nums">
                {stats.maxCombo}x
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 p-2.5 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">ENEMIES SLICED</div>
              <div className="text-base font-black text-slate-200 font-mono tabular-nums">
                {stats.enemiesKilled}
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 p-2.5 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">BOSS DEFEATS</div>
              <div className="text-base font-black text-amber-400 font-mono tabular-nums">
                {stats.bossesDefeated}
              </div>
            </div>
          </div>

          {/* Leaderboard Submission Form */}
          <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
            <div className="text-xs text-slate-300 font-semibold mb-2 flex items-center justify-between">
              <span>SUBMIT SCORE TO GLOBAL BOARD</span>
              {submitted && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {submittedRank ? `Your Rank: #${submittedRank}` : 'Score Saved!'}
                </span>
              )}
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmitScore} className="flex gap-2">
                <input
                  type="text"
                  maxLength={18}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Player Name"
                  className="flex-1 bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !playerName.trim()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Score'}
                </button>
              </form>
            ) : (
              <button
                onClick={onOpenLeaderboard}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-cyan-400" />
                <span>View On Leaderboard</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-3">
          <button
            onClick={onOpenLeaderboard}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/25 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
