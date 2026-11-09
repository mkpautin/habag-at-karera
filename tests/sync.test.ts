import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { streamEvents } from '../src/lib/client';
import { eventStream } from '../src/lib/server/events';

function session(t: TestContext) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const storage: Storage = { length: 1, key: () => 'habag-session', getItem: () => 'test-session-token', setItem: () => undefined, removeItem: () => undefined, clear: () => undefined };
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: storage });
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous); else Reflect.deleteProperty(globalThis, 'sessionStorage'); });
}

test('serverless synchronization returns a short-lived polling configuration', async t => {
  const previous = process.env.VERCEL;
  process.env.VERCEL = '1';
  t.after(() => { if (previous === undefined) delete process.env.VERCEL; else process.env.VERCEL = previous; });
  const response = eventStream(new Request('http://localhost/api/game/events'), 'test-group');
  assert.equal(response.headers.get('content-type'), 'application/json');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await response.json(), { transport: 'poll', intervalMs: 2000 });
});

test('polling awaits each refresh and aborts without an extra request', { timeout: 5000 }, async t => {
  session(t);
  const controller = new AbortController();
  let fetches = 0;
  t.mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
    fetches++;
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer test-session-token');
    return Response.json({ transport: 'poll', intervalMs: 1000 });
  });
  let refreshes = 0;
  let active = 0;
  let maximum = 0;
  await streamEvents('/api/game/events', async () => {
    active++;
    maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 20));
    active--;
    refreshes++;
    if (refreshes === 2) controller.abort();
  }, controller.signal);
  assert.equal(fetches, 1);
  assert.equal(refreshes, 2);
  assert.equal(maximum, 1);
});

test('self-hosted SSE still reconciles on connect and receives events', async t => {
  session(t);
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async () => new Response('data: {"version":7}\n\n', { headers: { 'Content-Type': 'text/event-stream' } }));
  const versions: number[] = [];
  await streamEvents('/api/game/events', event => {
    versions.push(event.version);
    if (event.version === 7) controller.abort();
  }, controller.signal);
  assert.deepEqual(versions, [-1, 7]);
});

test('an already-aborted subscription makes no request', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected request.'); });
  const controller = new AbortController();
  controller.abort();
  await streamEvents('/api/game/events', () => { throw new Error('Unexpected refresh.'); }, controller.signal);
  assert.equal(fetch.mock.callCount(), 0);
});
