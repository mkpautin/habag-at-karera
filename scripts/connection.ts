import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { z } from 'zod';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');

const url = z.url().parse(process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL);
export const pool = new Pool({ connectionString: url, max: 2 });
export const db = drizzle(pool);
