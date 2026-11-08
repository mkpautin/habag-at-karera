export const TOKEN_KEY = 'habag-session';
export function token() { return sessionStorage.getItem(TOKEN_KEY); }
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...init, cache: 'no-store', headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...init.headers } });
  const data: unknown = await response.json();
  if (!response.ok) {
    const payload = data as { code?: string; message?: string; state?: unknown };
    throw Object.assign(new Error(payload.message ?? 'May problema sa koneksiyon.'), { status: response.status, code: payload.code, state: payload.state });
  }
  return data as T;
}
export async function streamEvents(path: string, onEvent: (event: { version: number }) => void, signal: AbortSignal) {
  let delay = 1000;
  while (!signal.aborted) {
    try {
      const response = await fetch(path, { headers: { Authorization: `Bearer ${token()}` }, signal, cache: 'no-store' });
      if (!response.ok || !response.body) throw new Error('Stream unavailable');
      onEvent({ version: -1 });
      const reader = response.body.getReader(); let buffer = '';
      while (!signal.aborted) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += new TextDecoder().decode(value, { stream: true });
        const blocks = buffer.split('\n\n'); buffer = blocks.pop() ?? '';
        for (const block of blocks) {
          const line = block.split('\n').find(x => x.startsWith('data: '));
          if (line) { try { onEvent(JSON.parse(line.slice(6))); } catch { /* malformed event */ } }
        }
      }
      delay = 1000;
    } catch { if (signal.aborted) break; }
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, 10000);
  }
}
