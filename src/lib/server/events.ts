import 'server-only';
import { Client } from 'pg';

export function eventStream(request: Request, groupId?: string) {
  const encoder = new TextEncoder();
  let listener: Client | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (value: string) => { try { controller.enqueue(encoder.encode(value)); } catch { /* disconnected */ } };
      const close = async () => { if (heartbeat) clearInterval(heartbeat); if (listener) { await listener.end().catch(() => undefined); listener = null; } try { controller.close(); } catch { /* already closed */ } };
      request.signal.addEventListener('abort', () => { void close(); }, { once: true });
      listener = new Client({ connectionString: process.env.DATABASE_URL });
      try {
        await listener.connect();
        await listener.query('LISTEN habag_state');
        send(': connected\n\n');
        listener.on('notification', message => {
          try {
            const event: unknown = JSON.parse(message.payload ?? '');
            if (typeof event !== 'object' || !event || !('groupId' in event) || !('version' in event)) return;
            if (!groupId || event.groupId === groupId) send(`data: ${JSON.stringify(event)}\n\n`);
          } catch { /* ignore malformed notification */ }
        });
        listener.on('error', () => { void close(); });
        heartbeat = setInterval(() => send(': heartbeat\n\n'), 15000);
      } catch { await close(); }
    },
    async cancel() { if (heartbeat) clearInterval(heartbeat); if (listener) await listener.end().catch(() => undefined); },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' } });
}
