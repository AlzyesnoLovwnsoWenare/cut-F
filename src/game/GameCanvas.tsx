import React, { useCallback, useEffect, useRef } from 'react';
import { FRUIT_DEFINITIONS, BLADE_THEMES } from './fruitData.ts';
import {
  BladePoint,
  BladeTheme,
  FloatingText,
  FlyingEntity,
  FruitDef,
  GameMode,
  Particle,
  SlicedHalf,
  Splatter,
} from './types.ts';
import { soundEngine } from '../audio/soundEngine.ts';

interface GameCanvasProps {
  mode: GameMode;
  isPlaying: boolean;
  isPaused: boolean;
  bladeThemeId: string;
  onScoreUpdate: (newScore: number, added: number) => void;
  onCombo: (count: number, bonus: number) => void;
  onMissFruit: (fruit: FruitDef) => void;
  onHitBomb: () => void;
  onGameOver: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  mode,
  isPlaying,
  isPaused,
  bladeThemeId,
  onScoreUpdate,
  onCombo,
  onMissFruit,
  onHitBomb,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Entities state in refs for maximum 60fps performance without React re-render overhead
  const entitiesRef = useRef<FlyingEntity[]>([]);
  const slicedHalvesRef = useRef<SlicedHalf[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const splattersRef = useRef<Splatter[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const bladeTrailRef = useRef<BladePoint[]>([]);

  // Input tracking
  const isPointerDownRef = useRef(false);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);

  // Game timing and wave pacing
  const lastSpawnTimeRef = useRef(0);
  const nextSpawnDelayRef = useRef(1400);
  const gameStartTimeRef = useRef(0);
  const scoreRef = useRef(0);

  // Combo tracking within swipe gesture
  const currentSwipeFruitsRef = useRef<{ id: string; time: number; points: number }[]>([]);
  const lastCutTimeRef = useRef(0);

  // Screen shake / flash fx
  const screenShakeRef = useRef({ intensity: 0, duration: 0 });
  const flashAlphaRef = useRef(0);

  const selectedBlade: BladeTheme =
    BLADE_THEMES.find((b) => b.id === bladeThemeId) || BLADE_THEMES[0];

  // Helper to add floating combo or score text
  const addFloatingText = (
    text: string,
    x: number,
    y: number,
    color = '#ffffff',
    subtext?: string,
    scale = 1
  ) => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      scale,
      alpha: 1,
      vy: -1.6,
      subtext,
    });
  };

  // Helper to create splatter on canvas
  const createSplatter = (x: number, y: number, color: string, radius: number) => {
    const dripCount = 3 + Math.floor(Math.random() * 4);
    const drips = [];
    for (let i = 0; i < dripCount; i++) {
      const angle = Math.PI * 0.2 + Math.random() * Math.PI * 0.6; // dripping downward
      const dist = radius * (0.8 + Math.random() * 1.4);
      drips.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        len: 12 + Math.random() * 28,
        width: 2 + Math.random() * 4,
      });
    }

    splattersRef.current.push({
      x,
      y,
      radius,
      color,
      alpha: 0.65,
      drips,
    });

    // Keep max 25 splatters for memory
    if (splattersRef.current.length > 25) {
      splattersRef.current.shift();
    }
  };

  // Helper to spawn bursting particles
  const spawnSliceParticles = (
    x: number,
    y: number,
    color: string,
    accentColor: string,
    cutAngle: number
  ) => {
    const count = 28;
    for (let i = 0; i < count; i++) {
      // Particles spread outward perpendicularly to the cut
      const spreadAngle = cutAngle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2) + (Math.random() - 0.5) * 0.8;
      const speed = 2.5 + Math.random() * 8.5;
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 15,
        vx: Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed - 2,
        radius: 2 + Math.random() * 4.5,
        color: Math.random() > 0.3 ? color : accentColor,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        gravity: 0.22,
        isGlow: Math.random() > 0.5,
      });
    }
  };

  // Check line segment collision with circle
  const checkLineIntersectsCircle = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    circle: { x: number; y: number; radius: number }
  ): boolean => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
      const distSq = (circle.x - p1.x) ** 2 + (circle.y - p1.y) ** 2;
      return distSq <= circle.radius ** 2;
    }

    // Projection scalar t
    let t = ((circle.x - p1.x) * dx + (circle.y - p1.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = p1.x + t * dx;
    const closestY = p1.y + t * dy;

    const distSq = (circle.x - closestX) ** 2 + (circle.y - closestY) ** 2;
    return distSq <= circle.radius ** 2;
  };

  // Slice an entity
  const handleSliceEntity = useCallback((entity: FlyingEntity, p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    if (entity.sliced) return;
    entity.sliced = true;

    const cutAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    if (entity.isBomb) {
      // Sliced a bomb!
      soundEngine.playExplosion();
      screenShakeRef.current = { intensity: 24, duration: 25 };
      flashAlphaRef.current = 0.9;

      // Particle explosion
      for (let i = 0; i < 45; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 12;
        particlesRef.current.push({
          x: entity.x,
          y: entity.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 3 + Math.random() * 6,
          color: Math.random() > 0.4 ? '#ef4444' : '#f59e0b',
          alpha: 1,
          decay: 0.02 + Math.random() * 0.02,
          gravity: 0.2,
          isGlow: true,
        });
      }

      addFloatingText('BOMB!', entity.x, entity.y, '#ef4444', '-10 PTS', 1.4);
      onHitBomb();
      return;
    }

    const fruit = entity.fruitDef!;
    soundEngine.playSlice(fruit);

    // Score calculations
    const now = Date.now();
    scoreRef.current += fruit.points;
    onScoreUpdate(scoreRef.current, fruit.points);

    // Juice splatters and burst particles
    createSplatter(entity.x, entity.y, fruit.innerColor, fruit.radius);
    spawnSliceParticles(entity.x, entity.y, fruit.innerColor, fruit.rindColor, cutAngle);

    // Split into 2 halves
    const normalAngle = cutAngle + Math.PI / 2;
    const impulseSpeed = 3.5;

    // Half 1
    slicedHalvesRef.current.push({
      id: Math.random().toString(),
      fruitDef: fruit,
      x: entity.x,
      y: entity.y,
      vx: entity.vx + Math.cos(normalAngle) * impulseSpeed,
      vy: entity.vy + Math.sin(normalAngle) * impulseSpeed - 1,
      rotation: entity.rotation,
      vRot: entity.vRot - 0.08,
      radius: entity.radius,
      cutAngle,
      isRightSide: false,
      alpha: 1,
    });

    // Half 2
    slicedHalvesRef.current.push({
      id: Math.random().toString(),
      fruitDef: fruit,
      x: entity.x,
      y: entity.y,
      vx: entity.vx - Math.cos(normalAngle) * impulseSpeed,
      vy: entity.vy - Math.sin(normalAngle) * impulseSpeed - 1,
      rotation: entity.rotation,
      vRot: entity.vRot + 0.08,
      radius: entity.radius,
      cutAngle,
      isRightSide: true,
      alpha: 1,
    });

    // Combo tracking
    if (now - lastCutTimeRef.current < 280) {
      currentSwipeFruitsRef.current.push({ id: fruit.id, time: now, points: fruit.points });
    } else {
      currentSwipeFruitsRef.current = [{ id: fruit.id, time: now, points: fruit.points }];
    }
    lastCutTimeRef.current = now;

    const currentCombo = currentSwipeFruitsRef.current.length;
    if (currentCombo >= 3) {
      const comboBonus = currentCombo * 10;
      scoreRef.current += comboBonus;
      onScoreUpdate(scoreRef.current, comboBonus);
      onCombo(currentCombo, comboBonus);
      soundEngine.playCombo(currentCombo);
      addFloatingText(
        `COMBO x${currentCombo}!`,
        entity.x,
        entity.y - 25,
        '#38bdf8',
        `+${comboBonus} BONUS`,
        1.3
      );
    } else {
      addFloatingText(`+${fruit.points}`, entity.x, entity.y - 15, fruit.rindColor);
    }
  }, [onHitBomb, onScoreUpdate, onCombo]);

  // Handle cut testing for recent blade segment
  const processBladeCut = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (dist < 4) return; // Ignore microscopic jitter

    // Play swish sound for swift movements
    if (dist > 35) {
      soundEngine.playSwish();
    }

    // Check collision against all unsliced active entities
    entitiesRef.current.forEach((entity) => {
      if (entity.sliced) return;
      if (checkLineIntersectsCircle(p1, p2, entity)) {
        handleSliceEntity(entity, p1, p2);
      }
    });
  }, [handleSliceEntity]);

  // Spawn a wave/salvo of fruits and bombs
  const spawnSalvo = (canvasWidth: number, canvasHeight: number) => {
    const elapsedSec = (Date.now() - gameStartTimeRef.current) / 1000;
    // Salvo size increases over time: 1-2 at start, up to 4-5
    const minCount = elapsedSec > 35 ? 2 : 1;
    const maxCount = elapsedSec > 45 ? 5 : elapsedSec > 20 ? 4 : 3;
    const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));

    const fruitKeys = Object.keys(FRUIT_DEFINITIONS) as Array<keyof typeof FRUIT_DEFINITIONS>;

    for (let i = 0; i < count; i++) {
      // Bomb spawn chance (zero in Zen mode, increases up to 30% in arcade/classic)
      const bombChance = mode === 'zen' ? 0 : Math.min(0.3, 0.08 + elapsedSec * 0.003);
      const isBomb = Math.random() < bombChance && i > 0; // Never first entity

      // Launch position along bottom with padding
      const x = canvasWidth * 0.15 + Math.random() * (canvasWidth * 0.7);
      const y = canvasHeight + 40;

      // Aim toward center/upper canvas
      const targetX = canvasWidth * 0.3 + Math.random() * (canvasWidth * 0.4);
      const targetY = canvasHeight * 0.2 + Math.random() * (canvasHeight * 0.25);

      // Trajectory physics
      const gravity = 0.36;
      // Time to apex: roughly 40-55 frames
      const apexTime = 42 + Math.random() * 14;
      const vy = -gravity * apexTime;
      const vx = (targetX - x) / apexTime;

      if (isBomb) {
        entitiesRef.current.push({
          id: Math.random().toString(),
          isBomb: true,
          x,
          y,
          vx,
          vy,
          rotation: 0,
          vRot: (Math.random() - 0.5) * 0.08,
          radius: 36,
          sliced: false,
          sparkPhase: 0,
        });
        soundEngine.startBombSizzle();
      } else {
        const randomFruitKey = fruitKeys[Math.floor(Math.random() * fruitKeys.length)];
        const fruitDef = FRUIT_DEFINITIONS[randomFruitKey];

        entitiesRef.current.push({
          id: Math.random().toString(),
          isBomb: false,
          fruitDef,
          x,
          y,
          vx,
          vy,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.12,
          radius: fruitDef.radius,
          sliced: false,
        });
      }
    }

    // Schedule next salvo delay (1.2s - 2.5s)
    const baseDelay = Math.max(1100, 2400 - elapsedSec * 20);
    nextSpawnDelayRef.current = baseDelay + Math.random() * 700;
  };

  // Reset or initialize game
  useEffect(() => {
    if (isPlaying) {
      entitiesRef.current = [];
      slicedHalvesRef.current = [];
      particlesRef.current = [];
      splattersRef.current = [];
      floatingTextsRef.current = [];
      bladeTrailRef.current = [];
      scoreRef.current = 0;
      gameStartTimeRef.current = Date.now();
      lastSpawnTimeRef.current = Date.now() + 600; // brief opening breather
    }
  }, [isPlaying]);

  // Main 60 FPS animation & render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Screen shake logic
      ctx.save();
      if (screenShakeRef.current.duration > 0) {
        const s = screenShakeRef.current.intensity;
        const offsetX = (Math.random() - 0.5) * s;
        const offsetY = (Math.random() - 0.5) * s;
        ctx.translate(offsetX, offsetY);
        screenShakeRef.current.duration--;
        screenShakeRef.current.intensity *= 0.9;
      }

      // Clear frame with transparent wipe
      ctx.clearRect(-20, -20, width + 40, height + 40);

      // 1. Draw persistent fading juice splatters
      for (let i = splattersRef.current.length - 1; i >= 0; i--) {
        const sp = splattersRef.current[i];
        if (!isPaused) {
          sp.alpha -= 0.0006; // Fades out over ~25 seconds
        }
        if (sp.alpha <= 0) {
          splattersRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, sp.alpha * 0.4);
        ctx.fillStyle = sp.color;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = 12;

        // Central blob
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Drips
        sp.drips.forEach((d) => {
          ctx.beginPath();
          ctx.ellipse(
            sp.x + d.x,
            sp.y + d.y + d.len * 0.4,
            d.width,
            d.len * 0.6,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
        ctx.restore();
      }

      // 2. Spawn and update flying entities
      const now = Date.now();
      if (isPlaying && !isPaused) {
        if (now - lastSpawnTimeRef.current >= nextSpawnDelayRef.current) {
          spawnSalvo(width, height);
          lastSpawnTimeRef.current = now;
        }
      }

      // Gravity constant
      const gravity = 0.36;

      // 3. Update & render Flying Entities
      for (let i = entitiesRef.current.length - 1; i >= 0; i--) {
        const ent = entitiesRef.current[i];

        if (!isPaused) {
          ent.x += ent.vx;
          ent.y += ent.vy;
          ent.vy += gravity;
          ent.rotation += ent.vRot;
          if (ent.isBomb && ent.sparkPhase !== undefined) {
            ent.sparkPhase += 0.25;
          }
        }

        // Check if entity fell off bottom screen
        if (ent.y > height + 80 && ent.vy > 0) {
          if (!ent.sliced && !ent.isBomb && isPlaying && !isPaused) {
            // Missed fruit!
            if (mode === 'classic') {
              onMissFruit(ent.fruitDef!);
            }
          }
          if (ent.isBomb) {
            soundEngine.stopBombSizzle();
          }
          entitiesRef.current.splice(i, 1);
          continue;
        }

        if (ent.sliced) {
          // Once sliced, halves take over rendering
          entitiesRef.current.splice(i, 1);
          continue;
        }

        // Draw Entity
        ctx.save();
        ctx.translate(ent.x, ent.y);
        ctx.rotate(ent.rotation);

        if (ent.isBomb) {
          drawBomb(ctx, ent.radius, ent.sparkPhase || 0);
        } else if (ent.fruitDef) {
          drawWholeFruit(ctx, ent.fruitDef);
        }

        ctx.restore();
      }

      // 4. Update & render Sliced Halves
      for (let i = slicedHalvesRef.current.length - 1; i >= 0; i--) {
        const half = slicedHalvesRef.current[i];
        if (!isPaused) {
          half.x += half.vx;
          half.y += half.vy;
          half.vy += gravity * 1.1;
          half.rotation += half.vRot;
          half.alpha -= 0.008;
        }

        if (half.y > height + 100 || half.alpha <= 0) {
          slicedHalvesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, half.alpha);
        ctx.translate(half.x, half.y);
        ctx.rotate(half.rotation);
        drawSlicedHalf(ctx, half);
        ctx.restore();
      }

      // 5. Update & render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        if (!isPaused) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.alpha -= p.decay;
        }

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        if (p.isGlow) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 6. Update & render Floating Texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        if (!isPaused) {
          ft.y += ft.vy;
          ft.alpha -= 0.018;
          ft.scale = Math.min(1.4, ft.scale + 0.015);
        }

        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.translate(ft.x, ft.y);
        ctx.scale(ft.scale, ft.scale);
        ctx.font = '900 22px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 12;
        ctx.fillText(ft.text, 0, 0);

        if (ft.subtext) {
          ctx.font = '700 13px Outfit, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 6;
          ctx.fillText(ft.subtext, 0, 18);
        }
        ctx.restore();
      }

      // 7. Update & render Blade Trail
      // Prune old blade points (> 180ms)
      const trailTimeLimit = 180;
      bladeTrailRef.current = bladeTrailRef.current.filter((pt) => now - pt.time <= trailTimeLimit);

      if (bladeTrailRef.current.length >= 2) {
        drawBladeTrail(ctx, bladeTrailRef.current, selectedBlade);
      }

      // Flash overlay
      if (flashAlphaRef.current > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${flashAlphaRef.current * 0.4})`;
        ctx.fillRect(0, 0, width, height);
        flashAlphaRef.current = Math.max(0, flashAlphaRef.current - 0.04);
      }

      ctx.restore(); // Restore shake

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isPaused, mode, onMissFruit, selectedBlade]);

  // Pointer & Touch handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    isPointerDownRef.current = true;
    lastPointerPosRef.current = { x, y };
    bladeTrailRef.current = [{ x, y, time: Date.now() }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Both mouse down drag OR high-speed movement (for desktop mouse feel)
    const isSwiping = isPointerDownRef.current || e.buttons > 0;
    if (!isSwiping) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const now = Date.now();
    bladeTrailRef.current.push({ x, y, time: now });

    if (lastPointerPosRef.current) {
      processBladeCut(lastPointerPosRef.current, { x, y });
    }

    lastPointerPosRef.current = { x, y };
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    lastPointerPosRef.current = null;
  };

  // Adjust canvas size to parent container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none touch-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute inset-0 w-full h-full cursor-crosshair z-10"
      />
    </div>
  );
};

// --- DRAWING HELPERS ---

function drawBladeTrail(
  ctx: CanvasRenderingContext2D,
  trail: BladePoint[],
  theme: BladeTheme
) {
  const len = trail.length;
  if (len < 2) return;

  // Pass 1: Neon outer glow
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = theme.glowColor;
  ctx.shadowBlur = 18;

  for (let i = 0; i < len - 1; i++) {
    const progress = (i + 1) / len; // 0 (tail) -> 1 (head)
    const p1 = trail[i];
    const p2 = trail[i + 1];

    ctx.strokeStyle = theme.trailColor;
    ctx.lineWidth = Math.max(2, progress * 14);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // Pass 2: White razor sharp core
  ctx.shadowBlur = 4;
  ctx.strokeStyle = '#ffffff';
  for (let i = 0; i < len - 1; i++) {
    const progress = (i + 1) / len;
    const p1 = trail[i];
    const p2 = trail[i + 1];

    ctx.lineWidth = Math.max(1, progress * 4.5);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawWholeFruit(ctx: CanvasRenderingContext2D, def: FruitDef) {
  const r = def.radius;

  // Outer Neon Glow Aura
  ctx.shadowColor = def.rindColor;
  ctx.shadowBlur = 16;

  if (def.id === 'watermelon') {
    // Striped Neon Watermelon
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Dark wavy stripes
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 4;
    for (let a = -r * 0.7; a <= r * 0.7; a += 16) {
      ctx.beginPath();
      ctx.arc(a, 0, r * 0.95, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();
    }
  } else if (def.id === 'orange') {
    // Citrus Orange with peel dimples
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Subtle highlight ring
    ctx.strokeStyle = def.rindColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (def.id === 'dragonfruit') {
    // Dragonfruit with scaled exterior
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neon green scaled tips
    ctx.fillStyle = def.accentColor;
    const tips = [
      { x: -r * 0.7, y: -r * 0.3, a: -0.4 },
      { x: r * 0.7, y: -r * 0.3, a: 0.4 },
      { x: -r * 0.6, y: r * 0.4, a: -0.6 },
      { x: r * 0.6, y: r * 0.4, a: 0.6 },
      { x: 0, y: -r * 0.95, a: 0 },
    ];
    tips.forEach((t) => {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.a);
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(6, 6);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  } else if (def.id === 'kiwi') {
    // Fuzzy kiwi skin
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.9, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (def.id === 'banana') {
    // Crescent Banana
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, -r * 0.5, r * 1.2, 0.4, Math.PI - 0.4);
    ctx.quadraticCurveTo(0, r * 0.8, -r * 0.8, -r * 0.1);
    ctx.fill();

    // Stem tip
    ctx.fillStyle = '#713f12';
    ctx.fillRect(r * 0.65, -r * 0.1, 7, 7);
  } else if (def.id === 'strawberry') {
    // Berry shape
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.bezierCurveTo(-r * 1.1, r * 0.3, -r * 0.8, -r * 0.7, 0, -r * 0.7);
    ctx.bezierCurveTo(r * 0.8, -r * 0.7, r * 1.1, r * 0.3, 0, r);
    ctx.fill();

    // Green leafy cap
    ctx.fillStyle = def.accentColor;
    ctx.beginPath();
    ctx.moveTo(-12, -r * 0.7);
    ctx.lineTo(0, -r * 0.95);
    ctx.lineTo(12, -r * 0.7);
    ctx.lineTo(0, -r * 0.6);
    ctx.closePath();
    ctx.fill();
  } else {
    // Frenzy Golden Pineapple
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.ellipse(0, 5, r * 0.85, r, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing diamond criss-cross
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    for (let i = -r * 0.6; i <= r * 0.6; i += 14) {
      ctx.beginPath();
      ctx.moveTo(i, -r * 0.6);
      ctx.lineTo(i + 20, r * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, r * 0.6);
      ctx.lineTo(i + 20, -r * 0.6);
      ctx.stroke();
    }

    // Spiky crown
    ctx.fillStyle = '#10b981';
    for (let c = -15; c <= 15; c += 10) {
      ctx.beginPath();
      ctx.moveTo(c, -r * 0.8);
      ctx.lineTo(c * 1.5, -r * 1.3);
      ctx.lineTo(c + 8, -r * 0.8);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Specular sheen light
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.25, r * 0.12, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawSlicedHalf(ctx: CanvasRenderingContext2D, half: SlicedHalf) {
  const def = half.fruitDef;
  const r = half.radius;

  // We rotate so the cut plane is horizontal
  ctx.rotate(half.cutAngle);

  // Clip to half circle (top or bottom based on side)
  ctx.save();
  ctx.beginPath();
  if (half.isRightSide) {
    ctx.arc(0, 0, r, 0, Math.PI, false);
  } else {
    ctx.arc(0, 0, r, Math.PI, Math.PI * 2, false);
  }
  ctx.closePath();
  ctx.clip();

  // 1. Rind / Outer Skin
  ctx.fillStyle = def.rindColor;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // 2. Inner Flesh
  ctx.fillStyle = def.innerColor;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  ctx.fill();

  // 3. Exposed Anatomy Details
  if (def.id === 'watermelon') {
    // Watermelon Seeds
    ctx.fillStyle = def.seedColor;
    const seedAngles = [0.3, 0.8, 1.4, 2.0, 2.5, 3.4, 4.0, 4.8, 5.5];
    seedAngles.forEach((a) => {
      const sx = Math.cos(a) * (r * 0.55);
      const sy = Math.sin(a) * (r * 0.55);
      ctx.beginPath();
      ctx.ellipse(sx, sy, 3, 5, a, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (def.id === 'orange') {
    // Citrus Wedges
    ctx.strokeStyle = def.rindColor;
    ctx.lineWidth = 1.5;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * (r * 0.85), Math.sin(a) * (r * 0.85));
      ctx.stroke();
    }
    // Center pith
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (def.id === 'kiwi' || def.id === 'dragonfruit') {
    // Ring of tiny seeds
    ctx.fillStyle = def.seedColor;
    for (let a = 0; a < Math.PI * 2; a += 0.3) {
      const dist = r * (def.id === 'kiwi' ? 0.45 : 0.6);
      const sx = Math.cos(a) * dist + (Math.random() - 0.5) * 6;
      const sy = Math.sin(a) * dist + (Math.random() - 0.5) * 6;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (def.id === 'kiwi') {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  // Fresh Cut Edge Gleam Line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.stroke();
}

function drawBomb(ctx: CanvasRenderingContext2D, radius: number, sparkPhase: number) {
  // Dark metallic chrome shell
  const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 4, 0, 0, radius);
  grad.addColorStop(0, '#334155');
  grad.addColorStop(0.6, '#0f172a');
  grad.addColorStop(1, '#020617');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Danger Red Glowing Outer Rim
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 14;
  ctx.stroke();

  // Hazard Icon: Glowing Skull / Crossbones / Hazard Symbol in center
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, -2, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(-6, 5, 12, 6);

  // Crossbones
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-14, -14);
  ctx.lineTo(14, 14);
  ctx.moveTo(14, -14);
  ctx.lineTo(-14, 14);
  ctx.stroke();

  // Eye sockets
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.arc(-3, -3, 2.5, 0, Math.PI * 2);
  ctx.arc(3, -3, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Bomb Fuse Collar
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-6, -radius - 6, 12, 6);

  // Curved Fuse
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -radius - 6);
  ctx.quadraticCurveTo(8, -radius - 18, 16, -radius - 22);
  ctx.stroke();

  // Burning Sizzling Spark on Fuse Tip
  const sparkX = 16;
  const sparkY = -radius - 22;

  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, 4.5 + Math.sin(sparkPhase) * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Sputtering spark embers
  ctx.fillStyle = '#ef4444';
  for (let s = 0; s < 5; s++) {
    const angle = sparkPhase * 3 + s * 1.25;
    const dist = 6 + Math.sin(sparkPhase + s) * 8;
    ctx.beginPath();
    ctx.arc(
      sparkX + Math.cos(angle) * dist,
      sparkY + Math.sin(angle) * dist,
      1.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}
