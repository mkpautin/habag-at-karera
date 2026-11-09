import { pollingConfigSchema } from './sync';

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
function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>(resolve => {
    if (signal.aborted) { resolve(); return; }
    const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve(); };
    const timer = setTimeout(finish, ms);
    signal.addEventListener('abort', finish, { once: true });
  });
}

export async function streamEvents(path: string, onEvent: (event: { version: number }) => void | Promise<void>, signal: AbortSignal) {
  let delay = 1000;
  while (!signal.aborted) {
    try {
      const response = await fetch(path, { headers: { Authorization: `Bearer ${token()}` }, signal, cache: 'no-store' });
      if (signal.aborted) return;
      if (response.status === 401 || response.status === 403) { await onEvent({ version: -1 }); return; }
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const config = pollingConfigSchema.parse(await response.json());
        while (!signal.aborted) {
          await onEvent({ version: -1 });
          await pause(config.intervalMs, signal);
        }
        return;
      }
      if (!response.ok || !response.body) throw new Error('Stream unavailable');
      await onEvent({ version: -1 });
      const reader = response.body.getReader(); let buffer = '';
      const decoder = new TextDecoder();
      try { while (!signal.aborted) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n'); buffer = blocks.pop() ?? '';
        for (const block of blocks) {
          const line = block.split('\n').find(x => x.startsWith('data: '));
          if (line && !signal.aborted) { try { await onEvent(JSON.parse(line.slice(6))); } catch { /* malformed event */ } }
        }
      } } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
      delay = 1000;
    } catch { if (signal.aborted) break; }
    await pause(delay, signal);
    delay = Math.min(delay * 2, 10000);
  }
}
