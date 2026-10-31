import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Award, Flame, Check } from 'lucide-react';
import { GameMode } from '../game/types.ts';
import { soundEngine } from '../audio/soundEngine.ts';

interface GameOverModalProps {
  score: number;
  highScore: number;
  mode: GameMode;
  totalSliced: number;
  maxCombo: number;
  bombsHit: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onSaveScore: (playerName: string) => void;
  onViewLeaderboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  mode,
  totalSliced,
  maxCombo,
  bombsHit,
  onPlayAgain,
  onMainMenu,
  onSaveScore,
  onViewLeaderboard,
}) => {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('neon_blade_player_name') || 'CYBER_NINJA';
  });
  const [saved, setSaved] = useState(false);
  const isNewHighScore = score > 0 && score >= highScore;

  useEffect(() => {
    soundEngine.playGameOver();

    if (isNewHighScore) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#ff007f', '#39ff14', '#facc15'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [isNewHighScore]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || saved) return;
    soundEngine.playClick();
    localStorage.setItem('neon_blade_player_name', playerName.trim().toUpperCase());
    onSaveScore(playerName.trim().toUpperCase());
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/95 border border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.85)] p-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-xs uppercase tracking-widest text-pink-400 font-bold">
            Session Terminated
          </div>
          <h2 className="text-3xl font-black text-slate-100 uppercase tracking-wide">
            Game Over
          </h2>
        </div>

        {/* Score Display */}
        <div className="text-center py-4 px-6 rounded-xl bg-slate-950/60 border border-slate-800/80 relative overflow-hidden">
          {isNewHighScore && (
            <div className="absolute top-2 right-3 flex items-center gap-1 text-[11px] font-bold text-amber-400 tracking-wider uppercase">
              <Award className="w-3.5 h-3.5" />
              <span>New Record!</span>
            </div>
          )}
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Final Score
          </div>
          <div className="text-5xl font-black font-mono tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-pink-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            {score}
          </div>
        </div>

        {/* Stats Matrix */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Sliced</div>
            <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
              {totalSliced}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Max Combo</div>
            <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
              x{maxCombo}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Bombs Hit</div>
            <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">
              {bombsHit}
            </div>
          </div>
        </div>

        {/* Save to Leaderboard Input */}
        <form onSubmit={handleSave} className="space-y-2">
          <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Post to Neon Leaderboard
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={12}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={saved}
              placeholder="ENTER CALLSIGN"
              className="flex-1 px-3 py-2 text-xs font-mono font-bold tracking-widest uppercase rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={saved || !playerName.trim()}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all ${
                saved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Posted</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </button>
          </div>
        </form>

        {/* Actions */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => {
              soundEngine.playClick();
              onPlayAgain();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundEngine.playClick();
                onViewLeaderboard();
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Rankings</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onMainMenu();
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-transparent transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
