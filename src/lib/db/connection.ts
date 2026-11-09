import 'server-only';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { z } from 'zod';
import { attachDatabasePool } from '@vercel/functions';

// Next imports route modules while building. The deployment supplies the real URL at runtime.
const DATABASE_URL = process.env.DATABASE_URL ? z.url().parse(process.env.DATABASE_URL) : 'postgres://build:build@localhost:5432/build';
const globalDb = globalThis as typeof globalThis & { habagPool?: Pool };
export const pool = globalDb.habagPool ?? new Pool({
  connectionString: DATABASE_URL,
  max: process.env.VERCEL === '1' ? 5 : 10,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});
if (!globalDb.habagPool) {
  if (process.env.VERCEL === '1') attachDatabasePool(pool);
  globalDb.habagPool = pool;
}
export const db = drizzle(pool);
