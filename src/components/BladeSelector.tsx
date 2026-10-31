import React from 'react';
import { X, Check } from 'lucide-react';
import { BLADE_THEMES } from '../game/fruitData.ts';
import { soundEngine } from '../audio/soundEngine.ts';

interface BladeSelectorProps {
  currentBladeId: string;
  onSelectBlade: (id: string) => void;
  onClose: () => void;
}

export const BladeSelector: React.FC<BladeSelectorProps> = ({
  currentBladeId,
  onSelectBlade,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/95 border border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.85)] p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-100">
              Blade Armory
            </h2>
            <p className="text-xs text-slate-400">Choose your neon laser swipe trail</p>
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

        {/* Blade List */}
        <div className="space-y-2.5">
          {BLADE_THEMES.map((blade) => {
            const isSelected = blade.id === currentBladeId;

            return (
              <button
                key={blade.id}
                onClick={() => {
                  soundEngine.playClick();
                  onSelectBlade(blade.id);
                }}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all text-left ${
                  isSelected
                    ? 'bg-slate-800/90 border-slate-600 shadow-md ring-1 ring-white/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Glowing color disc */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      backgroundColor: blade.glowColor,
                      boxShadow: `0 0 14px ${blade.glowColor}`,
                    }}
                  >
                    <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      {blade.name}
                    </div>
                    {/* Simulated Trail Beam Preview */}
                    <div className="flex items-center gap-1 mt-1">
                      <div
                        className="h-1.5 w-24 rounded-full"
                        style={{
                          background: `linear-gradient(to right, transparent, ${blade.glowColor}, #ffffff)`,
                          boxShadow: `0 0 8px ${blade.glowColor}`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold uppercase text-slate-400 hover:text-slate-300">
                    Equip
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 text-center">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs uppercase tracking-wider transition-colors"
          >
            Confirm & Close
          </button>
        </div>
      </div>
    </div>
  );
};
