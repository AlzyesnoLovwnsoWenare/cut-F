import React from 'react';
import { Play, Flame, ShieldAlert, Sparkles, Swords, Trophy, HelpCircle } from 'lucide-react';
import { GameMode } from '../game/types.ts';
import { BLADE_THEMES } from '../game/fruitData.ts';
import { soundEngine } from '../audio/soundEngine.ts';

interface TitleMenuProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onStartGame: () => void;
  bladeThemeId: string;
  onOpenArmory: () => void;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
  highScore: number;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  selectedMode,
  onSelectMode,
  onStartGame,
  bladeThemeId,
  onOpenArmory,
  onOpenLeaderboard,
  onOpenRules,
  highScore,
}) => {
  const currentBlade =
    BLADE_THEMES.find((b) => b.id === bladeThemeId) || BLADE_THEMES[0];

  const modes: Array<{
    id: GameMode;
    title: string;
    description: string;
    meta: string;
    icon: React.ReactNode;
    color: string;
    borderActive: string;
  }> = [
    {
      id: 'arcade',
      title: 'Arcade Rush',
      description: '60s adrenaline test with combos & frenzy pineapples. Bombs cause glitch & score drop.',
      meta: '60 Seconds · Combo Bonuses · Frenzy Flurry',
      icon: <Flame className="w-5 h-5 text-cyan-400" />,
      color: 'from-cyan-500/20 to-transparent',
      borderActive: 'border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.25)]',
    },
    {
      id: 'classic',
      title: 'Classic Slice',
      description: 'Pure reflex master. 3 lives total. Missed fruits cost a strike, slicing a bomb is fatal!',
      meta: '3 Lives · Zero Miss Mercy · Fatal Bombs',
      icon: <ShieldAlert className="w-5 h-5 text-pink-400" />,
      color: 'from-pink-500/20 to-transparent',
      borderActive: 'border-pink-500/70 shadow-[0_0_20px_rgba(236,72,153,0.25)]',
    },
    {
      id: 'zen',
      title: 'Zen Flow',
      description: '90s tranquil slicing session. No bombs, no lives lost, pure hypnotic cutting bliss.',
      meta: '90 Seconds · No Bombs · Pure Flow State',
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      color: 'from-emerald-500/20 to-transparent',
      borderActive: 'border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    },
  ];

  return (
    <div className="relative z-20 flex flex-col items-center justify-center min-h-[calc(100vh-70px)] px-4 py-8 max-w-4xl mx-auto text-center space-y-8 animate-in fade-in duration-300">
      {/* Title Hero */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400">
          <span>Dark Neon Arcade Experience</span>
          <span aria-hidden="true">·</span>
          <span>Web Audio Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]">
          Neon Fruit Cut
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Slice high-velocity flying neon fruits with laser precision trails, realistic anatomical physics, and juice splatter mechanics.
        </p>

        {/* Clean Unboxed Metadata */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-mono pt-1">
          <span>All-Time Record</span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-300 font-bold tabular-nums">{highScore} PTS</span>
          <span aria-hidden="true">·</span>
          <span>Blade: {currentBlade.name}</span>
        </div>
      </div>

      {/* Mode Selection Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        {modes.map((m) => {
          const isSelected = selectedMode === m.id;

          return (
            <button
              key={m.id}
              onClick={() => {
                soundEngine.playClick();
                onSelectMode(m.id);
              }}
              className={`p-5 rounded-2xl border transition-all text-left flex flex-col justify-between relative overflow-hidden group ${
                isSelected
                  ? `bg-slate-900/90 ${m.borderActive}`
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-30 pointer-events-none transition-opacity ${
                  isSelected ? 'opacity-70' : 'opacity-10 group-hover:opacity-30'
                }`}
              />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    {m.icon}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Selected
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100 tracking-wide">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              </div>

              {/* Quiet clean metadata line */}
              <div className="relative z-10 pt-4 mt-3 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
                {m.meta}
              </div>
            </button>
          );
        })}
      </div>

      {/* Launch CTA Button */}
      <div className="space-y-4 pt-2">
        <button
          onClick={() => {
            soundEngine.playClick();
            onStartGame();
          }}
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 text-slate-950 font-black text-base uppercase tracking-widest hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Launch Match</span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/15">
            {selectedMode.toUpperCase()}
          </span>
        </button>

        {/* Quick Toolbar */}
        <div className="flex items-center justify-center gap-3 text-xs">
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenArmory();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-slate-700 transition-colors"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Customize Blade</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenLeaderboard();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-slate-700 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenRules();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>
        </div>
      </div>
    </div>
  );
};
