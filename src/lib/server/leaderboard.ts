import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { groups, stationRuns } from '@/lib/db/schema';

export async function leaderboard() {
  const rows = await db.select({ group: groups, run: stationRuns }).from(groups).leftJoin(stationRuns, eq(stationRuns.groupId, groups.id));
  const entries = new Map<string, { id: string; name: string; phase: string; times: (number | null)[]; total: number | null; rank: number | null }>();
  for (const { group, run } of rows) {
    if (!entries.has(group.id)) entries.set(group.id, { id: group.id, name: group.name, phase: group.phase, times: [null, null, null], total: null, rank: null });
    if (run?.elapsedMs != null) entries.get(group.id)!.times[run.stationNumber - 1] = run.elapsedMs;
  }
  const all = [...entries.values()];
  const finished = all.filter(x => x.phase === 'FINISHED').map(x => ({ ...x, total: x.times.reduce<number>((sum, value) => sum + (value ?? 0), 0) })).sort((a, b) => a.total - b.total);
  finished.forEach((item, index) => { item.rank = index && item.total === finished[index - 1].total ? finished[index - 1].rank : index + 1; });
  return { finished, playing: all.filter(x => x.phase !== 'FINISHED').sort((a, b) => a.name.localeCompare(b.name)) };
}
