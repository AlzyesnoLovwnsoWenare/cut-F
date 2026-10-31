import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './game/GameCanvas.tsx';
import { HeaderNav } from './components/HeaderNav.tsx';
import { HUD } from './components/HUD.tsx';
import { TitleMenu } from './components/TitleMenu.tsx';
import { PauseModal } from './components/PauseModal.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { LeaderboardModal } from './components/LeaderboardModal.tsx';
import { BladeSelector } from './components/BladeSelector.tsx';
import { InstructionsModal } from './components/InstructionsModal.tsx';
import { GameMode, GameStatus, LeaderboardEntry, FruitDef } from './game/types.ts';
import { soundEngine } from './audio/soundEngine.ts';

// Pre-seeded high scores for arcade feel
const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    name: 'NEON_VIPER',
    score: 1420,
    mode: 'arcade',
    maxCombo: 6,
    slicedCount: 94,
    date: '2026-10-28',
  },
  {
    id: 'seed-2',
    name: 'CYBER_SLICER',
    score: 1180,
    mode: 'arcade',
    maxCombo: 5,
    slicedCount: 78,
    date: '2026-10-27',
  },
  {
    id: 'seed-3',
    name: 'BLADE_RUNNER',
    score: 890,
    mode: 'arcade',
    maxCombo: 4,
    slicedCount: 62,
    date: '2026-10-25',
  },
  {
    id: 'seed-4',
    name: 'KATANA_ZERO',
    score: 950,
    mode: 'classic',
    maxCombo: 5,
    slicedCount: 72,
    date: '2026-10-29',
  },
  {
    id: 'seed-5',
    name: 'GRID_GHOST',
    score: 720,
    mode: 'classic',
    maxCombo: 4,
    slicedCount: 54,
    date: '2026-10-26',
  },
  {
    id: 'seed-6',
    name: 'ZEN_LOTUS',
    score: 1340,
    mode: 'zen',
    maxCombo: 7,
    slicedCount: 88,
    date: '2026-10-30',
  },
];

export default function App() {
  const [status, setStatus] = useState<GameStatus>('MENU');
  const [mode, setMode] = useState<GameMode>('arcade');
  const [bladeThemeId, setBladeThemeId] = useState<string>(() => {
    return localStorage.getItem('neon_blade_theme') || 'cyan';
  });

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [lives, setLives] = useState(3);
  const [totalSliced, setTotalSliced] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [currentCombo, setCurrentCombo] = useState(0);
  const [bombsHit, setBombsHit] = useState(0);

  // Modals state
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showArmory, setShowArmory] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Leaderboard entries
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('neon_blade_leaderboard');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return INITIAL_LEADERBOARD;
  });

  // Calculate high score for current mode
  const currentModeHighScore = leaderboard
    .filter((e) => e.mode === mode)
    .reduce((max, e) => Math.max(max, e.score), 0);

  // Timer reference for arcade and zen modes
  const timerRef = useRef<number | null>(null);

  // Start new match
  const handleStartGame = useCallback(() => {
    setScore(0);
    setTotalSliced(0);
    setMaxCombo(0);
    setCurrentCombo(0);
    setBombsHit(0);
    setLives(3);

    const initialDuration = mode === 'arcade' ? 60 : mode === 'zen' ? 90 : 0;
    setTimeLeft(initialDuration);

    setStatus('PLAYING');

    // Start background music automatically if not already playing
    soundEngine.playMusic();
  }, [mode]);

  // Handle game over
  const triggerGameOver = useCallback(() => {
    setStatus('GAME_OVER');
    soundEngine.stopBombSizzle();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (status === 'PLAYING' && (mode === 'arcade' || mode === 'zen')) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            triggerGameOver();
            return 0;
          }
          if (prev <= 11) {
            soundEngine.playTimerTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, mode, triggerGameOver]);

  // Keyboard shortcut for pausing (Escape or Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Space') {
        if (status === 'PLAYING') {
          e.preventDefault();
          setStatus('PAUSED');
        } else if (status === 'PAUSED') {
          e.preventDefault();
          setStatus('PLAYING');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  // Score callback from Canvas
  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
    setTotalSliced((prev) => prev + 1);
  }, []);

  // Combo callback
  const handleCombo = useCallback((combo: number) => {
    setCurrentCombo(combo);
    setMaxCombo((prev) => Math.max(prev, combo));
    // Clear combo display after 1.5s
    setTimeout(() => {
      setCurrentCombo((curr) => (curr === combo ? 0 : curr));
    }, 1500);
  }, []);

  // Missed fruit in Classic mode
  const handleMissFruit = useCallback((fruit: FruitDef) => {
    if (mode === 'classic' && status === 'PLAYING') {
      soundEngine.playClick();
      setLives((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          triggerGameOver();
          return 0;
        }
        return next;
      });
    }
  }, [mode, status, triggerGameOver]);

  // Hit Bomb handler
  const handleHitBomb = useCallback(() => {
    setBombsHit((prev) => prev + 1);

    if (mode === 'classic') {
      triggerGameOver();
    } else if (mode === 'arcade') {
      // Penalty in arcade mode
      setScore((prev) => Math.max(0, prev - 10));
    }
  }, [mode, triggerGameOver]);

  // Save score to leaderboard
  const handleSaveScore = useCallback((playerName: string) => {
    const newEntry: LeaderboardEntry = {
      id: Math.random().toString(),
      name: playerName,
      score,
      mode,
      maxCombo,
      slicedCount: totalSliced,
      date: new Date().toISOString().split('T')[0],
    };

    setLeaderboard((prev) => {
      const updated = [newEntry, ...prev];
      try {
        localStorage.setItem('neon_blade_leaderboard', JSON.stringify(updated));
      } catch {
        // LocalStorage safety
      }
      return updated;
    });
  }, [score, mode, maxCombo, totalSliced]);

  // Reset leaderboard to factory seeds
  const handleResetLeaderboard = useCallback(() => {
    setLeaderboard(INITIAL_LEADERBOARD);
    localStorage.removeItem('neon_blade_leaderboard');
  }, []);

  // Blade theme selection
  const handleSelectBlade = useCallback((id: string) => {
    setBladeThemeId(id);
    localStorage.setItem('neon_blade_theme', id);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07080e] text-slate-100 flex flex-col font-sans select-none">
      {/* Background Cyber Grid & Radiant Neon Flares */}
      <div className="absolute inset-0 cyber-grid opacity-35 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-pink-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-600/5 blur-[160px] pointer-events-none" />

      {/* Top Bar Header */}
      <HeaderNav
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenArmory={() => setShowArmory(true)}
        onOpenRules={() => setShowRules(true)}
        onStartGame={handleStartGame}
        isPlaying={status === 'PLAYING'}
      />

      {/* Main Game Stage */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Full-screen 60FPS Game Canvas */}
        <GameCanvas
          mode={mode}
          isPlaying={status === 'PLAYING'}
          isPaused={status === 'PAUSED' || status === 'MENU' || status === 'GAME_OVER'}
          bladeThemeId={bladeThemeId}
          onScoreUpdate={handleScoreUpdate}
          onCombo={handleCombo}
          onMissFruit={handleMissFruit}
          onHitBomb={handleHitBomb}
          onGameOver={triggerGameOver}
        />

        {/* In-Game HUD (During active play or pause) */}
        {(status === 'PLAYING' || status === 'PAUSED') && (
          <HUD
            score={score}
            highScore={currentModeHighScore}
            timeLeft={timeLeft}
            lives={lives}
            maxLives={3}
            mode={mode}
            comboCount={currentCombo}
            onPause={() => setStatus('PAUSED')}
          />
        )}

        {/* Title Screen / Menu Overlay */}
        {status === 'MENU' && (
          <TitleMenu
            selectedMode={mode}
            onSelectMode={setMode}
            onStartGame={handleStartGame}
            bladeThemeId={bladeThemeId}
            onOpenArmory={() => setShowArmory(true)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onOpenRules={() => setShowRules(true)}
            highScore={currentModeHighScore}
          />
        )}

        {/* Pause Modal */}
        {status === 'PAUSED' && (
          <PauseModal
            onResume={() => setStatus('PLAYING')}
            onRestart={handleStartGame}
            onMainMenu={() => {
              setStatus('MENU');
              soundEngine.stopBombSizzle();
            }}
          />
        )}

        {/* Game Over Modal */}
        {status === 'GAME_OVER' && (
          <GameOverModal
            score={score}
            highScore={currentModeHighScore}
            mode={mode}
            totalSliced={totalSliced}
            maxCombo={maxCombo}
            bombsHit={bombsHit}
            onPlayAgain={handleStartGame}
            onMainMenu={() => setStatus('MENU')}
            onSaveScore={handleSaveScore}
            onViewLeaderboard={() => setShowLeaderboard(true)}
          />
        )}

        {/* Global Modals */}
        {showLeaderboard && (
          <LeaderboardModal
            entries={leaderboard}
            initialMode={mode}
            onClose={() => setShowLeaderboard(false)}
            onResetLeaderboard={handleResetLeaderboard}
          />
        )}

        {showArmory && (
          <BladeSelector
            currentBladeId={bladeThemeId}
            onSelectBlade={handleSelectBlade}
            onClose={() => setShowArmory(false)}
          />
        )}

        {showRules && (
          <InstructionsModal onClose={() => setShowRules(false)} />
        )}
      </main>
    </div>
  );
}
