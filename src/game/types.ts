export type GameMode = 'arcade' | 'classic' | 'zen';

export type GameStatus = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type FruitId = 
  | 'watermelon' 
  | 'orange' 
  | 'dragonfruit' 
  | 'kiwi' 
  | 'banana' 
  | 'strawberry' 
  | 'pineapple';

export interface FruitDef {
  id: FruitId;
  name: string;
  radius: number;
  points: number;
  color: string;
  innerColor: string;
  rindColor: string;
  accentColor: string;
  seedColor: string;
  isSpecial?: boolean;
}

export interface FlyingEntity {
  id: string;
  isBomb: boolean;
  fruitDef?: FruitDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  radius: number;
  sliced: boolean;
  missed?: boolean;
  scale?: number;
  sparkPhase?: number;
}

export interface SlicedHalf {
  id: string;
  fruitDef: FruitDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  radius: number;
  cutAngle: number;
  isRightSide: boolean;
  alpha: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  isGlow?: boolean;
}

export interface Splatter {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  drips: Array<{ x: number; y: number; len: number; width: number }>;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  scale: number;
  alpha: number;
  vy: number;
  subtext?: string;
}

export interface BladePoint {
  x: number;
  y: number;
  time: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  mode: GameMode;
  maxCombo: number;
  slicedCount: number;
  date: string;
}

export interface BladeTheme {
  id: string;
  name: string;
  trailColor: string;
  glowColor: string;
  coreColor: string;
}
