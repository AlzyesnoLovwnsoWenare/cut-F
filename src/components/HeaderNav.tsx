import React from 'react';
import { Sparkles, Trophy, HelpCircle, Swords, Play } from 'lucide-react';
import { MusicPlayerWidget } from './MusicPlayerWidget.tsx';
import { soundEngine } from '../audio/soundEngine.ts';

interface HeaderNavProps {
  onOpenLeaderboard: () => void;
  onOpenArmory: () => void;
  onOpenRules: () => void;
  onStartGame: () => void;
  isPlaying: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  onOpenLeaderboard,
  onOpenArmory,
  onOpenRules,
  onStartGame,
  isPlaying,
}) => {
  return (
    <header className="relative z-30 flex items-center justify-between gap-8 px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
        <span className="text-base sm:text-lg font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-pink-500 whitespace-nowrap">
          Neon Fruit Cut
        </span>
      </div>

      {/* Zone 2: 4 concise single-line nav links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wide uppercase text-slate-400">
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenArmory();
          }}
          className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors whitespace-nowrap"
        >
          <Swords className="w-3.5 h-3.5" />
          <span>Blade Armory</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenLeaderboard();
          }}
          className="flex items-center gap-1.5 hover:text-pink-400 transition-colors whitespace-nowrap"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Leaderboard</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenRules();
          }}
          className="flex items-center gap-1.5 hover:text-slate-200 transition-colors whitespace-nowrap"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Field Manual</span>
        </button>

        <div className="flex items-center gap-1.5 text-slate-500 whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-amber-400/80" />
          <span>Cyber Arcade</span>
        </div>
      </nav>

      {/* Zone 3: 1 primary action + AI Music Player */}
      <div className="flex items-center gap-3 shrink-0">
        <MusicPlayerWidget />

        {!isPlaying && (
          <button
            onClick={() => {
              soundEngine.playClick();
              onStartGame();
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-lg hover:shadow-[0_0_18px_rgba(6,182,212,0.6)] transition-all whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Now</span>
          </button>
        )}
      </div>
    </header>
  );
};
