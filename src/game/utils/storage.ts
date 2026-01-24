import { DifficultyLevel, HighScores, HighScoreEntry } from '../types';

const STORAGE_KEY = 'escape_lava_data';
const CURRENT_VERSION = 1;

function getDefaultData(): HighScores {
  return {
    version: CURRENT_VERSION,
    scores: {},
    tutorialShown: false,
    playerName: '',
  };
}

export function loadGameData(): HighScores {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return getDefaultData();
    }
    const parsed = JSON.parse(data) as HighScores;
    if (parsed.version !== CURRENT_VERSION) {
      return getDefaultData();
    }
    return parsed;
  } catch {
    return getDefaultData();
  }
}

export function saveGameData(data: HighScores): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('Failed to save game data to localStorage');
  }
}

export function getHighScore(difficulty: DifficultyLevel): HighScoreEntry | null {
  const data = loadGameData();
  return data.scores[difficulty] || null;
}

export function saveHighScore(difficulty: DifficultyLevel, time: number): boolean {
  const data = loadGameData();
  const existing = data.scores[difficulty];

  if (!existing || time < existing.time) {
    data.scores[difficulty] = {
      time,
      date: new Date().toISOString(),
    };
    saveGameData(data);
    return true;
  }
  return false;
}

export function isTutorialShown(): boolean {
  return loadGameData().tutorialShown;
}

export function markTutorialShown(): void {
  const data = loadGameData();
  data.tutorialShown = true;
  saveGameData(data);
}

export function getPlayerName(): string {
  const data = loadGameData();
  return data.playerName || '';
}

export function setPlayerName(name: string): void {
  const data = loadGameData();
  data.playerName = name;
  saveGameData(data);
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
