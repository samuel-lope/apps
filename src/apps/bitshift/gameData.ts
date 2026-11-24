export interface SoftwareDef {
  id: string;
  name: string;
  cost: number;
  type: 'dmg' | 'shield' | 'special' | 'drain' | 'pierce' | 'risk';
  val?: [number, number] | number;
  effect?: string;
  cooldown?: number;
  price?: number;
  desc: string;
}

export interface HardwareDef {
  id: 'cpu' | 'ram' | 'cooler';
  name: string;
  desc: string;
  baseCost: number;
  costMult: number;
  linear?: boolean;
  effect: (level: number) => string;
}

export interface SkillDef {
  name: string;
  color: string;
  desc: string;
  baseCost: number;
  stats: (lvl: number) => string;
}

export interface RankDef {
  lvl: number;
  title: string;
  xp: number;
}

export const CONFIG = {
  storageKey: 'bitshift_evolution_save_v5',
  initialBits: 0,
  initialHp: 20,
  initialAp: 3,
  maxApCap: 5,
  miningBaseRate: 0.5,
} as const;

export const SOFTWARE_DB: Record<string, SoftwareDef> = {
  PING: { id: 'PING', name: 'PING', cost: 1, type: 'dmg', val: [2, 4], desc: 'Dano leve.' },
  INJECT: { id: 'INJECT', name: 'INJECT', cost: 3, type: 'dmg', val: [6, 10], desc: 'Dano pesado.' },
  FIREWALL: {
    id: 'FIREWALL',
    name: 'FIREWALL',
    cost: 2,
    type: 'shield',
    val: 5,
    cooldown: 3,
    desc: '+5 Defesa (CD: 2).',
  },
  OVERCLOCK: {
    id: 'OVERCLOCK',
    name: 'OVERCLOCK',
    cost: 0,
    type: 'special',
    effect: 'swap',
    desc: '-3 HP / +3 BW.',
  },
  SIPHON: {
    id: 'SIPHON',
    name: 'VAMPIRE.exe',
    cost: 4,
    type: 'drain',
    val: [4, 6],
    price: 300,
    desc: 'Dano + Cura.',
  },
  ROOT: {
    id: 'ROOT',
    name: 'ROOT_KIT',
    cost: 3,
    type: 'pierce',
    val: [5, 8],
    price: 500,
    desc: 'Ignora Escudo.',
  },
  BRUTE: {
    id: 'BRUTE',
    name: 'BRUTE_FORCE',
    cost: 3,
    type: 'risk',
    val: [10, 15],
    price: 400,
    desc: 'Alto Risco (30% Falha).',
  },
  VIRUS: {
    id: 'VIRUS',
    name: 'POLYMORPH.vbs',
    cost: 4,
    type: 'dmg',
    val: [8, 12],
    price: 800,
    cooldown: 2,
    desc: 'Dano Alto (CD: 2).',
  },
};

export const HARDWARE_DB: HardwareDef[] = [
  {
    id: 'cpu',
    name: 'Neuro-CPU',
    desc: '+Base Dmg & Mining Rate',
    baseCost: 100,
    costMult: 2,
    effect: (level) => `Dmg +${level} | Mine +${(level * 0.2).toFixed(1)}`,
  },
  {
    id: 'ram',
    name: 'Quantum RAM',
    desc: '+5 Max HP',
    baseCost: 50,
    costMult: 1,
    linear: true,
    effect: (level) => `HP +${level * 5}`,
  },
  {
    id: 'cooler',
    name: 'Cryo-Cooler',
    desc: '+Start AP (Energy)',
    baseCost: 150,
    costMult: 1,
    linear: true,
    effect: (level) => `Start AP +${Math.floor(level / 2)}`,
  },
];

export const SKILLS_DB: Record<'offense' | 'defense', SkillDef> = {
  offense: {
    name: 'EXPL0IT PROTOCOLS',
    color: 'text-red-400',
    desc: 'Aumenta Crit Chance e Estabilidade.',
    baseCost: 200,
    stats: (lvl) => `CRIT: +${lvl * 5}% | STABLE: +${lvl * 4}%`,
  },
  defense: {
    name: 'ENCRYPTION LAYERS',
    color: 'text-blue-400',
    desc: 'Aumenta Shield e Mitigação.',
    baseCost: 200,
    stats: (lvl) => `SHIELD: +${lvl * 10}% | MITIGATE: +${lvl * 5}%`,
  },
};

export const RANKS: RankDef[] = [
  { lvl: 0, title: 'Script Kiddie', xp: 0 },
  { lvl: 1, title: 'Hacktivist', xp: 500 },
  { lvl: 2, title: 'Grey Hat', xp: 1500 },
  { lvl: 3, title: 'Netrunner', xp: 3000 },
  { lvl: 4, title: 'Cyber God', xp: 6000 },
  { lvl: 5, title: 'Singularity', xp: 12000 },
];

export const ENEMY_NAMES = [
  'GUEST',
  'PROXY',
  'GATEWAY',
  'SENTRY',
  'DAEMON',
  'MAINFRAME',
  'AI_CORE',
  'OVERMIND',
];
