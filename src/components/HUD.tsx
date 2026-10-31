import React from 'react';
import { Pause, Flame, Heart, AlertTriangle, Clock } from 'lucide-react';
import { GameMode } from '../game/types.ts';
import { soundEngine } from '../audio/soundEngine.ts';

interface HUDProps {
  score: number;
  highScore: number;
  timeLeft: number;
  lives: number;
  maxLives: number;
  mode: GameMode;
  comboCount: number;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  highScore,
  timeLeft,
  lives,
  maxLives,
  mode,
  comboCount,
  onPause,
}) => {
  const isTimeCritical = timeLeft <= 10 && (mode === 'arcade' || mode === 'zen');

  return (
    <div className="absolute inset-x-0 top-0 p-4 sm:p-6 pointer-events-none z-20 flex items-start justify-between">
      {/* Left: Score & High Score */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
            Score
          </span>
          <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-pink-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]">
            {score}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>BEST</span>
          <span className="text-slate-300 tabular-nums font-semibold">{highScore}</span>
        </div>
      </div>

      {/* Center: Timer (Arcade/Zen) or Lives (Classic) & Combo Banner */}
      <div className="flex flex-col items-center gap-2">
        {mode === 'classic' ? (
          /* Classic 3-Lives Indicator */
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 backdrop-blur-md">
            {Array.from({ length: maxLives }).map((_, idx) => {
              const isAlive = idx < lives;
              return (
                <div
                  key={idx}
                  className={`w-6 h-6 flex items-center justify-center rounded transition-all ${
                    isAlive
                      ? 'text-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                      : 'text-slate-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isAlive ? 'fill-current' : 'opacity-30'}`} />
                </div>
              );
            })}
          </div>
        ) : (
          /* Arcade & Zen Countdown Timer */
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border backdrop-blur-md transition-colors ${
              isTimeCritical
                ? 'bg-red-950/70 border-red-500/60 text-red-400 animate-pulse'
                : 'bg-slate-950/80 border-slate-800 text-slate-200'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-red-400' : 'text-cyan-400'}`} />
            <span className="font-mono text-xl sm:text-2xl font-bold tabular-nums">
              {timeLeft}s
            </span>
          </div>
        )}

        {/* Combo Multiplier Alert */}
        {comboCount >= 3 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-bold uppercase tracking-wider animate-bounce">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Combo x{comboCount}!</span>
          </div>
        )}
      </div>

      {/* Right: Mode Badge & Pause Button */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {mode === 'arcade' && <Flame className="w-3 h-3 text-cyan-400" />}
          {mode === 'classic' && <AlertTriangle className="w-3 h-3 text-pink-400" />}
          {mode === 'zen' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          <span>{mode} Mode</span>
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            onPause();
          }}
          className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-cyan-500/50 transition-all shadow-md focus:outline-none"
          title="Pause Game (ESC or Space)"
        >
          <Pause className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
