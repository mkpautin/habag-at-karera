import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test } from 'node:test';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import { accounts, groups, rateLimits, roundRuns, sessions, stationRuns } from '../src/lib/db/schema';

const testUrl = process.env.TEST_DATABASE_URL;

test('finished totals and admin resets remain correct with stale and concurrent requests', { skip: !testUrl, timeout: 30_000 }, async () => {
  if (!testUrl) return;
  assert.equal(new URL(testUrl).pathname, '/habag_test', 'Use an empty disposable database named habag_test.');
  process.env.DATABASE_URL = testUrl;
  const [{ db, pool }, { state, startGame, startStation, submit, hint }, { POST }, { AppError }] = await Promise.all([
    import('../src/lib/db/connection'),
    import('../src/lib/server/game'),
    import('../src/app/api/admin/reset/route'),
    import('../src/lib/server/http'),
  ]);
  const listener = new Client({ connectionString: testUrl });
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    assert.equal((await db.select().from(accounts)).length, 0, 'Refusing to test reset against a database containing accounts.');
    const [admin] = await db.insert(accounts).values({ username: 'test-admin', passwordHash: 'unused-in-session-tests', role: 'ADMIN' }).returning();
    const players = await db.insert(accounts).values([1, 2, 3, 4].map(number => ({ username: `test-group-${number}`, passwordHash: 'unused-in-session-tests', role: 'GROUP' as const }))).returning();
    const teams = await db.insert(groups).values(players.map((account, index) => ({ accountId: account.id, name: `Test ${index + 1}`, version: index + 10 }))).returning();
    const adminToken = randomBytes(32).toString('base64url');
    const groupToken = randomBytes(32).toString('base64url');
    await db.insert(sessions).values([
      { accountId: admin.id, tokenHash: createHash('sha256').update(adminToken).digest('hex'), expiresAt: new Date(Date.now() + 60_000) },
      { accountId: players[0].id, tokenHash: createHash('sha256').update(groupToken).digest('hex'), expiresAt: new Date(Date.now() + 60_000) },
    ]);
    const finishedAt = new Date('2026-01-01T00:10:00Z');
    await db.update(groups).set({ phase: 'FINISHED', finishedAt }).where(eq(groups.id, teams[0].id));
    const durations = [60_123, 90_456, 120_789];
    await db.insert(stationRuns).values(durations.map((elapsedMs, index) => ({ groupId: teams[0].id, stationNumber: index + 1, startedAt: new Date(finishedAt.getTime() - elapsedMs), completedAt: finishedAt, elapsedMs })));
    await db.insert(roundRuns).values({ groupId: teams[0].id, stationNumber: 3, roundNumber: 5, startedAt: new Date(finishedAt.getTime() - 1000), completedAt: finishedAt });
    // Another group's records must never affect the current group's ending time.
    await db.update(groups).set({ phase: 'STATION_1', currentRound: 1 }).where(eq(groups.id, teams[1].id));
    await db.insert(stationRuns).values({ groupId: teams[1].id, stationNumber: 1, startedAt: finishedAt });
    await db.insert(roundRuns).values({ groupId: teams[1].id, stationNumber: 1, roundNumber: 1, startedAt: finishedAt });
    await db.insert(rateLimits).values({ key: 'test-attempts', count: 60 });
    assert.equal((await state(teams[0].id)).totalElapsedMs, 271_368);
    assert.equal((await state(teams[0].id)).totalElapsedMs, 271_368);
    assert.equal((await state(teams[1].id)).totalElapsedMs, null);

    const request = (token?: string, confirmation = 'RESET') => new Request('http://localhost/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ confirmation }),
    });
    assert.equal((await POST(request())).status, 403);
    assert.equal((await POST(request(groupToken))).status, 403);
    assert.equal((await POST(request(adminToken, 'wrong'))).status, 400);
    assert.equal((await state(teams[0].id)).phase, 'FINISHED');

    await listener.connect();
    await listener.query('LISTEN habag_state');
    const events: { groupId: string; version: number }[] = [];
    let finishNotifications: () => void = () => undefined;
    const observed = new Promise<void>(resolve => { finishNotifications = resolve; });
    listener.on('notification', message => {
      events.push(JSON.parse(message.payload ?? '{}'));
      if (events.length === teams.length) finishNotifications();
    });
    assert.equal((await POST(request(adminToken))).status, 200);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([observed, new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('Missing reset notifications.')), 3000); })]);
    } finally { clearTimeout(timeout); }
    assert.deepEqual(events.map(event => event.groupId).sort(), teams.map(team => team.id).sort());
    for (const team of teams) {
      const current = await state(team.id);
      assert.equal(current.phase, 'LANDING');
      assert.equal(current.round, 0);
      assert.equal(current.version, team.version + 1);
      assert.equal(current.stationStartedAt, null);
      assert.equal(current.elapsedMs, null);
      assert.equal(current.totalElapsedMs, null);
      assert.equal(events.find(event => event.groupId === team.id)?.version, current.version);
    }
    assert.equal((await db.select().from(stationRuns)).length, 0);
    assert.equal((await db.select().from(roundRuns)).length, 0);
    assert.equal((await db.select().from(rateLimits)).length, 0);
    assert.equal((await db.select().from(accounts)).length, 5);
    assert.equal((await db.select().from(sessions)).length, 2);
    assert.ok((await db.select().from(groups)).every(team => team.finishedAt === null));

    const team = teams[0];
    const resetState = await state(team.id);
    await startGame(team.id, resetState.version);
    await startStation(team.id, 1);
    const isStale = (error: unknown) => error instanceof AppError && error.status === 409;
    await assert.rejects(submit(team.id, 1, 1, team.version, () => true), isStale);
    await assert.rejects(hint(team.id, 1, 1, team.version), isStale);
    assert.equal((await state(team.id)).round, 1);

    const running = await state(team.id);
    const [guess, reset] = await Promise.allSettled([
      submit(team.id, 1, 1, running.version, () => true),
      POST(request(adminToken)),
    ]);
    assert.equal(reset.status, 'fulfilled');
    if (reset.status === 'fulfilled') assert.equal(reset.value.status, 200);
    if (guess.status === 'rejected') assert.ok(isStale(guess.reason));
    assert.equal((await state(team.id)).phase, 'LANDING');
    assert.equal((await db.select().from(stationRuns)).length, 0);
    assert.equal((await db.select().from(roundRuns)).length, 0);
    assert.equal((await POST(request(adminToken))).status, 200, 'Admin session remains usable after repeated resets.');

    const runSeed = (password: string) => promisify(execFile)(process.execPath, ['--import', 'tsx', 'scripts/seed.ts'], {
      timeout: 10_000,
      env: {
        ...process.env,
        DATABASE_URL: testUrl,
        GROUP_1_PASSWORD: password,
        GROUP_2_PASSWORD: password,
        GROUP_3_PASSWORD: password,
        GROUP_4_PASSWORD: password,
        ADMIN_PASSWORD: password,
      },
    });
    await runSeed('initial-test-password');
    for (const [index, name] of ['Amihan', 'Buhawi', 'Daluyong', 'Sigwa'].entries()) {
      const [account] = await db.select().from(accounts).where(eq(accounts.username, name.toLowerCase()));
      const [group] = await db.select().from(groups).where(eq(groups.accountId, account.id));
      assert.equal(group.name, name);
      // Simulate accounts from a previous deployment, retaining their identities and passwords.
      await db.update(accounts).set({ username: `grupo${index + 1}` }).where(eq(accounts.id, account.id));
    }
    const [existingAccount] = await db.select().from(accounts).where(eq(accounts.username, 'grupo1'));
    const [existingGroup] = await db.select().from(groups).where(eq(groups.accountId, existingAccount.id));
    await db.update(groups).set({ name: 'Grupo 1', phase: 'STATION_1', currentRound: 2, version: 42 }).where(eq(groups.id, existingGroup.id));
    const [existingRun] = await db.insert(stationRuns).values({ groupId: existingGroup.id, stationNumber: 1, startedAt: finishedAt }).returning();
    const legacyToken = randomBytes(32).toString('base64url');
    const [legacySession] = await db.insert(sessions).values({ accountId: existingAccount.id, tokenHash: createHash('sha256').update(legacyToken).digest('hex'), expiresAt: new Date(Date.now() + 60_000) }).returning();
    await runSeed('replacement-test-password');
    for (const [index, username] of ['amihan', 'buhawi', 'daluyong', 'sigwa'].entries()) {
      assert.equal((await db.select().from(accounts).where(eq(accounts.username, username))).length, 1);
      assert.equal((await db.select().from(accounts).where(eq(accounts.username, `grupo${index + 1}`))).length, 0);
    }
    const [renamed] = await db.select().from(groups).where(eq(groups.id, existingGroup.id));
    const [unchangedAccount] = await db.select().from(accounts).where(eq(accounts.id, existingAccount.id));
    const [unchangedRun] = await db.select().from(stationRuns).where(eq(stationRuns.id, existingRun.id));
    assert.equal(renamed.name, 'Amihan');
    assert.equal(renamed.phase, 'STATION_1');
    assert.equal(renamed.currentRound, 2);
    assert.equal(renamed.version, 42);
    assert.equal(unchangedAccount.passwordHash, existingAccount.passwordHash);
    assert.equal(unchangedAccount.username, 'amihan');
    assert.deepEqual(unchangedRun, existingRun);
    const { authenticate, login } = await import('../src/lib/server/auth');
    const auth = await authenticate(new Request('http://localhost/api/game/state', { headers: { Authorization: `Bearer ${legacyToken}` } }));
    assert.equal(auth?.sessionId, legacySession.id);
    assert.equal(auth?.account.id, existingAccount.id);
    assert.equal(auth?.account.username, 'amihan');
    assert.equal(auth?.group?.id, existingGroup.id);
    assert.ok(await login('amihan', 'initial-test-password'));
    assert.equal(await login('grupo1', 'initial-test-password'), null);
    assert.equal(await login('amihan', 'replacement-test-password'), null);
    await runSeed('another-test-password');
    assert.equal((await db.select().from(accounts)).length, 10, 'Rerunning seed must not duplicate accounts.');
    assert.equal((await db.select().from(groups)).length, 8, 'Rerunning seed must not duplicate groups.');
    const [reseeded] = await db.select().from(accounts).where(eq(accounts.username, 'amihan'));
    assert.equal(reseeded.id, existingAccount.id);
    assert.equal(reseeded.passwordHash, existingAccount.passwordHash);

    // A conflict on the last group must roll back earlier renames in the same seed.
    await db.update(accounts).set({ username: 'grupo1' }).where(eq(accounts.id, existingAccount.id));
    await db.insert(accounts).values({ username: 'grupo4', passwordHash: 'duplicate-test-account', role: 'GROUP' });
    await assert.rejects(runSeed('conflict-test-password'), /Both grupo4 and sigwa exist/);
    assert.equal((await db.select().from(accounts).where(eq(accounts.username, 'grupo1')))[0].id, existingAccount.id);
    assert.equal((await db.select().from(accounts).where(eq(accounts.username, 'amihan'))).length, 0);
  } finally {
    await listener.end().catch(() => undefined);
    await pool.end();
  }
});
