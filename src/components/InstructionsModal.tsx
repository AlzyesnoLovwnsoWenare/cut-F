import React from 'react';
import { X, Flame, Bomb, Sparkles, MousePointer, ShieldAlert } from 'lucide-react';
import { FRUIT_DEFINITIONS } from '../game/fruitData.ts';
import { soundEngine } from '../audio/soundEngine.ts';

interface InstructionsModalProps {
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900/95 border border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.85)] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-100">
              Field Manual & Intel
            </h2>
            <p className="text-xs text-slate-400">Rules of engagement & slice tactics</p>
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

        {/* Section 1: Controls */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <MousePointer className="w-3.5 h-3.5" />
            <span>Control Mechanics</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <p>
              • <strong>Desktop:</strong> Click and drag your mouse across flying fruits, or make fast swipe gestures to slice.
            </p>
            <p>
              • <strong>Mobile & Touch:</strong> Swipe your finger across the glass to unleash your neon blade trail.
            </p>
          </div>
        </div>

        {/* Section 2: Combos & Multipliers */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Flame className="w-3.5 h-3.5" />
            <span>Combos & Multipliers</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <p>
              Slice <strong>3 or more fruits</strong> in a single swift swipe window (&lt;280ms) to trigger a Combo multiplier!
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono pt-1">
              <span>x3 = +30 PTS</span>
              <span>·</span>
              <span>x4 = +40 PTS</span>
              <span>·</span>
              <span>x5+ = +50+ PTS</span>
            </div>
          </div>
        </div>

        {/* Section 3: Hazard Intel (Bombs) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
            <Bomb className="w-3.5 h-3.5" />
            <span>Cyber Bombs</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <p>
              • In <strong>Classic Mode</strong>: Slicing a bomb detonates instantly and causes immediate Game Over! Dropping a fruit loses 1 of your 3 lives.
            </p>
            <p>
              • In <strong>Arcade Mode</strong>: Slicing a bomb detonates with a penalty (-10 points) and a 1-second system glitch stun.
            </p>
            <p>
              • In <strong>Zen Mode</strong>: Peaceful zero-hazard session with no bombs for 90 seconds.
            </p>
          </div>
        </div>

        {/* Section 4: Fruit Points Matrix */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Target Point Values</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(FRUIT_DEFINITIONS).map((f) => (
              <div
                key={f.id}
                className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: f.innerColor, boxShadow: `0 0 6px ${f.innerColor}` }}
                  />
                  <span className="text-xs font-semibold text-slate-200">{f.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums">
                  +{f.points}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs uppercase tracking-wider transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
