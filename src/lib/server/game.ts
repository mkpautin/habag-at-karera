import 'server-only';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { groups, roundRuns, stationRuns } from '@/lib/db/schema';
import { anagrams, contentReady, places, sequenceOrders } from './challenges';
import { AppError } from './http';

const roundCounts = [0, 3, 2, 5];
const stationOf = (phase: string) => phase.startsWith('STATION_') ? Number(phase.slice(-1)) : 0;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function now(tx: Tx) {
  const result = await tx.execute<{ now: Date }>(sql`select clock_timestamp() as now`);
  return new Date(result.rows[0].now);
}
async function locked(tx: Tx, groupId: string) {
  const [group] = await tx.select().from(groups).where(eq(groups.id, groupId)).for('update');
  if (!group) throw new AppError(404, 'NOT_FOUND', 'Hindi makita ang grupo.');
  return group;
}
async function notify(tx: Tx, groupId: string, version: number) {
  await tx.execute(sql`select pg_notify('habag_state', ${JSON.stringify({ groupId, version })})`);
}
export async function state(groupId: string) {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group) throw new AppError(404, 'NOT_FOUND', 'Hindi makita ang grupo.');
  const station = stationOf(group.phase);
  const [run] = station ? await db.select().from(stationRuns).where(and(eq(stationRuns.groupId, groupId), eq(stationRuns.stationNumber, station))) : [];
  const [round] = station && group.currentRound <= roundCounts[station] ? await db.select().from(roundRuns).where(and(eq(roundRuns.groupId, groupId), eq(roundRuns.stationNumber, station), eq(roundRuns.roundNumber, group.currentRound))) : [];
  const clock = await db.execute<{ now: Date }>(sql`select clock_timestamp() as now`);
  const challenge = !run?.completedAt && station && round?.startedAt ? station === 1 ? { scrambled: anagrams[group.currentRound - 1]?.scrambled } : station === 2 ? { imageIds: sequenceOrders[group.currentRound - 1] } : { image: `/api/assets/place?round=${group.currentRound}` } : null;
  return { group: group.name, phase: group.phase, round: group.currentRound, version: group.version, station, stationStartedAt: run?.startedAt?.toISOString() ?? null, stationCompletedAt: run?.completedAt?.toISOString() ?? null, elapsedMs: run?.elapsedMs ?? null, roundStartedAt: round?.startedAt?.toISOString() ?? null, serverTime: new Date(clock.rows[0].now).toISOString(), challenge, contentReady: station ? contentReady(station) : true };
}
export async function startGame(groupId: string, version: number) {
  await db.transaction(async tx => {
    const group = await locked(tx, groupId);
    if (group.version !== version || group.phase !== 'LANDING') throw new AppError(409, 'STATE_CHANGED', 'Nagbago na ang laro.');
    await tx.update(groups).set({ phase: 'STATION_1', currentRound: 1, version: group.version + 1 }).where(eq(groups.id, groupId));
    await notify(tx, groupId, group.version + 1);
  });
  return state(groupId);
}
export async function startStation(groupId: string, station: number) {
  await db.transaction(async tx => {
    const group = await locked(tx, groupId);
    if (stationOf(group.phase) !== station) throw new AppError(409, 'STATE_CHANGED', 'Nagbago na ang istasyon.');
    if (!contentReady(station)) throw new AppError(503, 'CONTENT_PENDING', 'Hindi pa handa ang nilalaman ng istasyong ito.');
    const [existing] = await tx.select().from(stationRuns).where(and(eq(stationRuns.groupId, groupId), eq(stationRuns.stationNumber, station)));
    if (existing?.startedAt) return;
    const time = await now(tx);
    await tx.insert(stationRuns).values({ groupId, stationNumber: station, startedAt: time });
    await tx.insert(roundRuns).values({ groupId, stationNumber: station, roundNumber: 1, startedAt: time });
    await tx.update(groups).set({ version: group.version + 1 }).where(eq(groups.id, groupId));
    await notify(tx, groupId, group.version + 1);
  });
  return state(groupId);
}
export async function submit(groupId: string, station: number, round: number, version: number, correct: (round: number) => boolean) {
  let accepted = false;
  await db.transaction(async tx => {
    const group = await locked(tx, groupId);
    if (group.version !== version || stationOf(group.phase) !== station || group.currentRound !== round) throw new AppError(409, 'STATE_CHANGED', 'Nagbago na ang laro.');
    const [run] = await tx.select().from(stationRuns).where(and(eq(stationRuns.groupId, groupId), eq(stationRuns.stationNumber, station)));
    if (!run?.startedAt || run.completedAt) throw new AppError(409, 'STATE_CHANGED', 'Hindi aktibo ang istasyon.');
    if (!correct(round)) return;
    accepted = true;
    const time = await now(tx);
    await tx.update(roundRuns).set({ completedAt: time }).where(and(eq(roundRuns.groupId, groupId), eq(roundRuns.stationNumber, station), eq(roundRuns.roundNumber, round)));
    if (round === roundCounts[station]) await tx.update(stationRuns).set({ completedAt: time, elapsedMs: time.getTime() - run.startedAt.getTime() }).where(eq(stationRuns.id, run.id));
    else await tx.insert(roundRuns).values({ groupId, stationNumber: station, roundNumber: round + 1, startedAt: time });
    await tx.update(groups).set({ currentRound: round === roundCounts[station] ? round : round + 1, version: group.version + 1 }).where(eq(groups.id, groupId));
    await notify(tx, groupId, group.version + 1);
  });
  return { correct: accepted, message: accepted ? 'Tama ang iyong sagot!' : 'Hindi tama. Subukan muli!', state: await state(groupId) };
}
export async function transition(groupId: string, station: number, version: number) {
  await db.transaction(async tx => {
    const group = await locked(tx, groupId);
    if (group.version !== version || stationOf(group.phase) !== station) throw new AppError(409, 'STATE_CHANGED', 'Nagbago na ang laro.');
    const [run] = await tx.select().from(stationRuns).where(and(eq(stationRuns.groupId, groupId), eq(stationRuns.stationNumber, station)));
    if (!run?.completedAt) throw new AppError(400, 'NOT_COMPLETE', 'Tapusin muna ang istasyon.');
    await tx.update(groups).set({ phase: station === 3 ? 'FINISHED' : `STATION_${station + 1}` as 'STATION_2' | 'STATION_3', currentRound: station === 3 ? 0 : 1, finishedAt: station === 3 ? await now(tx) : null, version: group.version + 1 }).where(eq(groups.id, groupId));
    await notify(tx, groupId, group.version + 1);
  });
  return state(groupId);
}
export async function hint(groupId: string, station: number, round: number, version: number) {
  const current = await state(groupId);
  if (current.version !== version || current.station !== station || current.round !== round || current.stationCompletedAt) throw new AppError(409, 'STATE_CHANGED', 'Nagbago na ang laro.', current);
  if (station === 2) throw new AppError(400, 'NO_HINT', 'Walang gabay sa istasyong ito.');
  const threshold = station === 1 ? 180000 : 300000;
  const clock = await db.execute<{ now: Date }>(sql`select clock_timestamp() as now`);
  if (!current.roundStartedAt || new Date(clock.rows[0].now).getTime() - Date.parse(current.roundStartedAt) < threshold) throw new AppError(425, 'HINT_LOCKED', 'Hindi pa maaaring gamitin ang gabay. Maghintay hanggang sa itinakdang oras.');
  return { hint: station === 1 ? anagrams[round - 1].hint : places[round - 1].hint };
}
