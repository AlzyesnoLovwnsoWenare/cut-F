import { BladeTheme, FruitDef, FruitId } from './types.ts';

export const FRUIT_DEFINITIONS: Record<FruitId, FruitDef> = {
  watermelon: {
    id: 'watermelon',
    name: 'Neon Melon',
    radius: 46,
    points: 10,
    color: '#059669', // Emerald dark green rind
    innerColor: '#ff0055', // Glowing crimson red flesh
    rindColor: '#10b981', // Neon green rim
    accentColor: '#34d399',
    seedColor: '#050505',
  },
  orange: {
    id: 'orange',
    name: 'Solar Orange',
    radius: 38,
    points: 15,
    color: '#ea580c',
    innerColor: '#ff7700',
    rindColor: '#fbbf24',
    accentColor: '#fed7aa',
    seedColor: '#fffbeb',
  },
  dragonfruit: {
    id: 'dragonfruit',
    name: 'Cyber Pitaya',
    radius: 44,
    points: 20,
    color: '#db2777', // Vivid neon pink/magenta
    innerColor: '#f8fafc', // White flesh
    rindColor: '#ec4899',
    accentColor: '#10b981', // Green scaled tips
    seedColor: '#1e293b',
  },
  kiwi: {
    id: 'kiwi',
    name: 'Acid Kiwi',
    radius: 34,
    points: 20,
    color: '#78350f', // Brown fuzzy outer
    innerColor: '#84cc16', // Vibrant acid lime
    rindColor: '#a3e635',
    accentColor: '#fef08a', // Creamy center
    seedColor: '#1c1917',
  },
  banana: {
    id: 'banana',
    name: 'Hyper Banana',
    radius: 36,
    points: 25,
    color: '#eab308',
    innerColor: '#fef9c3',
    rindColor: '#facc15',
    accentColor: '#ca8a04',
    seedColor: '#713f12',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Plasma Berry',
    radius: 32,
    points: 30,
    color: '#dc2626',
    innerColor: '#f43f5e',
    rindColor: '#fb7185',
    accentColor: '#22c55e', // Green stem leaves
    seedColor: '#fef08a',
  },
  pineapple: {
    id: 'pineapple',
    name: 'Frenzy Core',
    radius: 48,
    points: 50,
    color: '#ca8a04',
    innerColor: '#eab308',
    rindColor: '#fde047',
    accentColor: '#10b981',
    seedColor: '#854d0e',
    isSpecial: true,
  },
};

export const BLADE_THEMES: BladeTheme[] = [
  {
    id: 'cyan',
    name: 'Cyber Cyan',
    trailColor: 'rgba(6, 182, 212, 0.85)',
    glowColor: '#00f0ff',
    coreColor: '#ffffff',
  },
  {
    id: 'magenta',
    name: 'Neon Pink',
    trailColor: 'rgba(236, 72, 153, 0.85)',
    glowColor: '#ff007f',
    coreColor: '#ffffff',
  },
  {
    id: 'lime',
    name: 'Acid Matrix',
    trailColor: 'rgba(132, 204, 22, 0.85)',
    glowColor: '#39ff14',
    coreColor: '#ffffff',
  },
  {
    id: 'amber',
    name: 'Solar Plasma',
    trailColor: 'rgba(245, 158, 11, 0.85)',
    glowColor: '#ff9900',
    coreColor: '#ffffff',
  },
  {
    id: 'purple',
    name: 'Void Purple',
    trailColor: 'rgba(168, 85, 247, 0.85)',
    glowColor: '#b026ff',
    coreColor: '#ffffff',
  },
];
