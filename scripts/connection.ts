import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { z } from 'zod';
import { existsSync } from 'node:fs';
import { databaseConnectionOptions } from '../src/lib/db/connection-options';

if (existsSync('.env')) process.loadEnvFile('.env');

const url = z.url().parse(process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL);
export const pool = new Pool({ ...databaseConnectionOptions(url), max: 2 });
export const db = drizzle(pool);
