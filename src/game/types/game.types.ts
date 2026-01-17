export enum DifficultyLevel {
  VERY_EASY = 'VERY_EASY',
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  HARDCORE = 'HARDCORE',
}

export interface DifficultySettings {
  name: string;
  nameRu: string;
  hearts: number;
  damagePerHit: number;
  lavaSpeed: number;
  lavaColor: number;
  targetFloors: number;
  heartSpawnChance: number;
  patternWeights: PatternWeights;
}

export interface PatternWeights {
  easy: number;
  medium: number;
  hard: number;
  special: number;
}

export interface PatternElement {
  type: 'platform' | 'ladder' | 'portal_in' | 'portal_out' | 'heart';
  x: number;
  y: number;
  width?: number;
  height?: number;
  portalId?: string;
}

export interface LevelPattern {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'special';
  heightInFloors: number;
  minEntryX: number;
  maxEntryX: number;
  minExitX: number;
  maxExitX: number;
  elements: PatternElement[];
}

export interface HighScoreEntry {
  time: number;
  date: string;
}

export interface HighScores {
  version: number;
  scores: Partial<Record<DifficultyLevel, HighScoreEntry>>;
  tutorialShown: boolean;
}

export enum GameState {
  LOADING = 'LOADING',
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  WIN = 'WIN',
  LOSE = 'LOSE',
}

export interface GameData {
  difficulty: DifficultyLevel;
  finalTime?: number;
  won?: boolean;
}
