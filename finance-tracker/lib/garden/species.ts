import type { ComponentType } from 'react';

export type SpeciesKey = 'sprout' | 'fern' | 'sunflower' | 'cactus' | 'tulip' | 'bonsai' | 'lavender' | 'lotus';

export interface PlantProps {
  stage: 1 | 2 | 3 | 4 | 5;
  mood: 'happy' | 'neutral' | 'sleepy' | 'hungry';
  size?: number;
}

export interface SpeciesConfig {
  key: SpeciesKey;
  name: string;
  description: string;
  palette: { primary: string; accent: string };
}

export const SPECIES_CONFIG: Record<SpeciesKey, SpeciesConfig> = {
  sprout: {
    key: 'sprout',
    name: 'Sprout',
    description: 'Patient and persistent — it grows when you show up.',
    palette: { primary: '#7BB89A', accent: '#D4A574' },
  },
  fern: {
    key: 'fern',
    name: 'Fern',
    description: 'Ancient and unhurried, it asks nothing but consistency.',
    palette: { primary: '#5A9870', accent: '#3D7055' },
  },
  sunflower: {
    key: 'sunflower',
    name: 'Sunflower',
    description: 'Turns toward the light. So does a well-kept ledger.',
    palette: { primary: '#D4A574', accent: '#C4903A' },
  },
  cactus: {
    key: 'cactus',
    name: 'Cactus',
    description: 'Thrives in dry spells. Resilient, never dramatic.',
    palette: { primary: '#61988E', accent: '#4A7A70' },
  },
  tulip: {
    key: 'tulip',
    name: 'Tulip',
    description: 'Brief and brilliant — the reward of patient seasons.',
    palette: { primary: '#C9848A', accent: '#A86068' },
  },
  bonsai: {
    key: 'bonsai',
    name: 'Bonsai',
    description: 'Shaped by small decisions made every single day.',
    palette: { primary: '#8B6340', accent: '#5A9478' },
  },
  lavender: {
    key: 'lavender',
    name: 'Lavender',
    description: 'Calm by nature. Grows best when you stop worrying.',
    palette: { primary: '#9B8EC4', accent: '#7B6EA4' },
  },
  lotus: {
    key: 'lotus',
    name: 'Lotus',
    description: 'Rises clean from deep water. Clarity from complexity.',
    palette: { primary: '#C9848A', accent: '#E8C49A' },
  },
};

export const SPECIES_KEYS: SpeciesKey[] = Object.keys(SPECIES_CONFIG) as SpeciesKey[];

export function randomSpeciesExcluding(current: SpeciesKey): SpeciesKey {
  const pool = SPECIES_KEYS.filter((k) => k !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}
