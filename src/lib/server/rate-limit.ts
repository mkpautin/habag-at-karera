import 'server-only';
import { createHash } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { rateLimits } from '@/lib/db/schema';
import { AppError } from './http';

export async function rateLimit(scope: string, identity: string, max: number, windowMs: number) {
  const key = createHash('sha256').update(`${scope}:${identity}`).digest('hex');
  await db.transaction(async tx => {
    await tx.insert(rateLimits).values({ key }).onConflictDoNothing();
    const [row] = await tx.select().from(rateLimits).where(eq(rateLimits.key, key)).for('update');
    const result = await tx.execute<{ now: Date }>(sql`select clock_timestamp() as now`);
    const time = new Date(result.rows[0].now);
    if (time.getTime() - row.windowStart.getTime() >= windowMs) {
      await tx.update(rateLimits).set({ windowStart: time, count: 1 }).where(eq(rateLimits.key, key));
    } else {
      if (row.count >= max) throw new AppError(429, 'RATE_LIMITED', 'Masyadong maraming pagsubok. Maghintay sandali.');
      await tx.update(rateLimits).set({ count: row.count + 1 }).where(eq(rateLimits.key, key));
    }
  });
}
