import { DifficultyLevel } from '../game/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export type LeaderboardEntry = {
  name: string;
  timeMs: number;
  createdAt?: string;
};

type SupabaseScoreRow = {
  name: string;
  time_ms: number;
  created_at: string;
};

function getRestEndpoint(path: string): string | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${path}`;
}

async function supabaseFetch(url: string, options: RequestInit): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('apikey', SUPABASE_ANON_KEY || '');
  headers.set('Authorization', `Bearer ${SUPABASE_ANON_KEY || ''}`);
  headers.set('Content-Type', 'application/json');
  return fetch(url, { ...options, headers });
}

export async function submitScore(
  name: string,
  timeMs: number,
  difficulty: DifficultyLevel,
): Promise<boolean> {
  const endpoint = getRestEndpoint('scores');
  if (!endpoint) return false;

  const payload = {
    name,
    time_ms: Math.max(1, Math.round(timeMs)),
    difficulty,
  };

  try {
    const response = await supabaseFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchLeaderboard(
  difficulty: DifficultyLevel,
  limit: number = 10,
): Promise<LeaderboardEntry[]> {
  const endpoint = getRestEndpoint(
    `scores?select=name,time_ms,created_at&difficulty=eq.${encodeURIComponent(
      difficulty,
    )}&order=time_ms.asc&limit=${limit}`,
  );
  if (!endpoint) return [];

  try {
    const response = await supabaseFetch(endpoint, { method: 'GET' });
    if (!response.ok) return [];

    const rows = (await response.json()) as SupabaseScoreRow[];
    return rows.map((row) => ({
      name: row.name || 'Unknown',
      timeMs: row.time_ms,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}
