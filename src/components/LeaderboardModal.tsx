import React, { useState } from 'react';
import { Trophy, X, RotateCcw } from 'lucide-react';
import { GameMode, LeaderboardEntry } from '../game/types.ts';
import { soundEngine } from '../audio/soundEngine.ts';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  initialMode?: GameMode;
  onClose: () => void;
  onResetLeaderboard: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  initialMode = 'arcade',
  onClose,
  onResetLeaderboard,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(initialMode);

  const filtered = entries
    .filter((e) => e.mode === selectedMode)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900/95 border border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.85)] p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100">
                Neon Hall of Fame
              </h2>
              <p className="text-xs text-slate-400">Top slice masters & high scores</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          {(['arcade', 'classic', 'zen'] as GameMode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                soundEngine.playClick();
                setSelectedMode(m);
              }}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                selectedMode === m
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              NO RECORDS LOGGED FOR {selectedMode.toUpperCase()} YET.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="grid grid-cols-12 px-4 py-2 font-semibold uppercase tracking-wider text-slate-400 text-[10px] bg-slate-900/60">
                <span className="col-span-2">Rank</span>
                <span className="col-span-4">Agent</span>
                <span className="col-span-3 text-right">Score</span>
                <span className="col-span-3 text-right">Max Combo</span>
              </div>

              {filtered.map((item, index) => {
                const isTop3 = index < 3;
                const medalColors = ['text-amber-400', 'text-slate-300', 'text-amber-600'];

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="col-span-2 flex items-center gap-1 font-mono font-bold">
                      <span className={isTop3 ? medalColors[index] : 'text-slate-400'}>
                        #{index + 1}
                      </span>
                    </div>
                    <div className="col-span-4 font-mono font-bold tracking-wider text-slate-200 truncate">
                      {item.name}
                    </div>
                    <div className="col-span-3 text-right font-mono font-bold tabular-nums text-cyan-300">
                      {item.score}
                    </div>
                    <div className="col-span-3 text-right font-mono tabular-nums text-slate-400">
                      x{item.maxCombo}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info & Reset button */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => {
              soundEngine.playClick();
              onResetLeaderboard();
            }}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset High Scores</span>
          </button>

          <span className="text-[11px] text-slate-400">
            Stored locally on your device
          </span>
        </div>
      </div>
    </div>
  );
};
