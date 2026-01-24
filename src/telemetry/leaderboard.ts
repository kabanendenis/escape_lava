import { DifficultyLevel } from '../game/types';

const DREAMLO_BASE_URL = 'http://dreamlo.com/lb';
const DREAMLO_PRIVATE_CODE = 'jIB6y8F9JEWzLP98ePrOfAZyLB0mEhHEK_xYf8tpk-rw';
const DREAMLO_PUBLIC_CODE = '69749e4e8f40bb1184c17150';

type DreamloEntry = {
  name?: string;
  score?: string;
  seconds?: string;
  text?: string;
  date?: string;
};

type DreamloResponse = {
  dreamlo?: {
    leaderboard?: {
      entry?: DreamloEntry | DreamloEntry[];
    };
  };
};

export type LeaderboardEntry = {
  name: string;
  timeMs: number;
  timeSeconds: number;
  text?: string;
  date?: string;
};

function normalizeEntries(data: DreamloResponse): DreamloEntry[] {
  const entry = data.dreamlo?.leaderboard?.entry;
  if (!entry) return [];
  return Array.isArray(entry) ? entry : [entry];
}

export async function submitScore(
  name: string,
  timeMs: number,
  difficulty: DifficultyLevel,
): Promise<boolean> {
  const timeSeconds = Math.max(0, Math.round(timeMs / 1000));
  const score = timeSeconds;
  const url = `${DREAMLO_BASE_URL}/${DREAMLO_PRIVATE_CODE}/add/${encodeURIComponent(
    name,
  )}/${score}/${timeSeconds}/${encodeURIComponent(difficulty)}`;

  try {
    const response = await fetch(url, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchLeaderboard(
  difficulty: DifficultyLevel,
  limit: number = 10,
): Promise<LeaderboardEntry[]> {
  const url = `${DREAMLO_BASE_URL}/${DREAMLO_PUBLIC_CODE}/json`;

  try {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) return [];

    const data = (await response.json()) as DreamloResponse;
    const entries = normalizeEntries(data)
      .filter((entry) => entry.text === difficulty)
      .map((entry) => {
        const secondsValue = Number(entry.seconds ?? entry.score ?? 0);
        const safeSeconds = Number.isFinite(secondsValue) ? secondsValue : 0;
        return {
          name: entry.name || 'Unknown',
          timeSeconds: safeSeconds,
          timeMs: Math.round(safeSeconds * 1000),
          text: entry.text,
          date: entry.date,
        };
      })
      .sort((a, b) => a.timeSeconds - b.timeSeconds);

    return entries.slice(0, limit);
  } catch {
    return [];
  }
}
