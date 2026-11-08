import 'server-only';
import { asc, sql } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { groups, rateLimits, roundRuns, stationRuns } from '@/lib/db/schema';

export async function resetCompetition() {
  await db.transaction(async tx => {
    // All game writes take this same row lock. Stable order also serializes concurrent resets.
    await tx.select({ id: groups.id }).from(groups).orderBy(asc(groups.id)).for('update');
    await tx.delete(roundRuns);
    await tx.delete(stationRuns);
    await tx.delete(rateLimits);
    const resetGroups = await tx.update(groups).set({
      phase: 'LANDING',
      currentRound: 0,
      finishedAt: null,
      // Never reuse a version: requests from before the reset must remain stale.
      version: sql`${groups.version} + 1`,
    }).returning({ id: groups.id, version: groups.version });
    for (const group of resetGroups) {
      await tx.execute(sql`select pg_notify('habag_state', ${JSON.stringify({ groupId: group.id, version: group.version })})`);
    }
  });
}
