const COUNTER_NAMESPACE = 'escape-lava';
const COUNTER_NAME = 'launches';

type CounterApiResponse = {
  count?: number;
  value?: number;
};

export async function incrementLaunchCount(): Promise<number | null> {
  const url = `https://api.counterapi.dev/v1/${encodeURIComponent(
    COUNTER_NAMESPACE,
  )}/${encodeURIComponent(COUNTER_NAME)}/up`;

  try {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) return null;

    const data = (await response.json()) as CounterApiResponse;
    if (typeof data.count === 'number') return data.count;
    if (typeof data.value === 'number') return data.value;
    return null;
  } catch {
    return null;
  }
}

export function setLaunchCountText(count: number | null): void {
  const el = document.getElementById('launch-counter');
  if (!el) return;

  if (count === null) {
    el.style.display = 'none';
    return;
  }

  el.textContent = `Запуски: ${count}`;
}
