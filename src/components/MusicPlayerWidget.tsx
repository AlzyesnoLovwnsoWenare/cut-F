import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music } from 'lucide-react';
import { soundEngine, TrackMeta, DEMO_TRACKS } from '../audio/soundEngine.ts';

export const MusicPlayerWidget: React.FC = () => {
  const [playbackState, setPlaybackState] = useState(soundEngine.getPlaybackState());
  const [isOpen, setIsOpen] = useState(false);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsubscribe = soundEngine.subscribe((state) => {
      setPlaybackState((prev) => ({
        ...prev,
        isPlaying: state.isPlaying,
        trackIndex: state.trackIndex,
        track: soundEngine.getTrackMeta(state.trackIndex),
      }));
    });
    return unsubscribe;
  }, []);

  // Visualizer loop
  useEffect(() => {
    let animId: number;
    const renderVis = () => {
      const canvas = visualizerCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const data = soundEngine.getVisualizerData();
          const barWidth = 3;
          const gap = 2;
          const barCount = 12;

          for (let i = 0; i < barCount; i++) {
            const val = playbackState.isPlaying ? data[i * 2] || 10 : 4;
            const barHeight = Math.max(3, (val / 255) * canvas.height);
            const x = i * (barWidth + gap);
            const y = canvas.height - barHeight;

            // Gradient cyan to pink
            ctx.fillStyle = i % 2 === 0 ? '#00f0ff' : '#ec4899';
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }
      }
      animId = requestAnimationFrame(renderVis);
    };

    animId = requestAnimationFrame(renderVis);
    return () => cancelAnimationFrame(animId);
  }, [playbackState.isPlaying]);

  const handleTogglePlay = () => {
    soundEngine.playClick();
    soundEngine.toggleMusic();
  };

  const handleNext = () => {
    soundEngine.playClick();
    soundEngine.nextTrack();
  };

  const handlePrev = () => {
    soundEngine.playClick();
    soundEngine.prevTrack();
  };

  const handleMuteToggle = () => {
    soundEngine.playClick();
    soundEngine.toggleMute();
    setPlaybackState(soundEngine.getPlaybackState());
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundEngine.setMusicVolume(val);
    setPlaybackState(soundEngine.getPlaybackState());
  };

  const currentTrack: TrackMeta = playbackState.track;

  return (
    <div className="relative">
      {/* Compact Header Pill Bar */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-sm">
        {/* Animated Canvas Mini Equalizer */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity focus:outline-none"
          title="Click to toggle music controls"
        >
          <canvas
            ref={visualizerCanvasRef}
            width={60}
            height={18}
            className="rounded"
          />
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">
              {currentTrack.title}
            </div>
            <div className="text-[10px] text-cyan-400 font-mono">
              {currentTrack.bpm} BPM · {playbackState.isPlaying ? 'PLAYING' : 'PAUSED'}
            </div>
          </div>
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={handleTogglePlay}
          className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
          aria-label={playbackState.isPlaying ? 'Pause music' : 'Play music'}
        >
          {playbackState.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {/* Skip Track Button */}
        <button
          onClick={handleNext}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Next track"
          title="Skip to next track"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Volume/Mute Button */}
        <button
          onClick={handleMuteToggle}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label={playbackState.isMuted ? 'Unmute' : 'Mute'}
        >
          {playbackState.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Track Selection Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-slate-950/95 border border-slate-800/90 shadow-2xl backdrop-blur-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Synthesized BGM</span>
            </div>
            <span className="text-[10px] text-cyan-400/80 font-mono">3 TRACKS</span>
          </div>

          {/* Track List */}
          <div className="space-y-1.5 mb-4">
            {DEMO_TRACKS.map((t, idx) => {
              const isActive = idx === playbackState.trackIndex;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    soundEngine.playClick();
                    soundEngine.playMusic(idx);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-200'
                      : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div>
                    <div className="font-medium text-slate-200">{t.title}</div>
                    <div className="text-[10px] text-slate-400">{t.genre}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-slate-400">{t.bpm} BPM</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>BGM Volume</span>
              <span className="font-mono text-cyan-400">
                {Math.round(playbackState.musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={playbackState.musicVolume}
              onChange={handleVolumeChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      )}
    </div>
  );
};
