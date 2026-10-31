import React from 'react';
import { Play, RotateCcw, Home, Volume2, Music } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine.ts';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMainMenu,
}) => {
  const playback = soundEngine.getPlaybackState();
  const [musicVol, setMusicVol] = React.useState(playback.musicVolume);
  const [sfxVol, setSfxVol] = React.useState(playback.sfxVolume);

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMusicVol(val);
    soundEngine.setMusicVolume(val);
  };

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSfxVol(val);
    soundEngine.setSfxVolume(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900/95 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 space-y-6">
        <div className="text-center space-y-1">
          <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
            Tactical Pause
          </div>
          <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wide">
            Game Suspended
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              soundEngine.playClick();
              onResume();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Slice</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Match</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onMainMenu();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-transparent transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Quit to Main Menu</span>
          </button>
        </div>

        {/* Audio Volume Controls */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                <span>Music Volume</span>
              </span>
              <span className="font-mono text-cyan-400">{Math.round(musicVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVol}
              onChange={handleMusicChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                <span>Sound FX Volume</span>
              </span>
              <span className="font-mono text-pink-400">{Math.round(sfxVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVol}
              onChange={handleSfxChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
