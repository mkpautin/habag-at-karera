import { defineConfig } from 'drizzle-kit';
import { existsSync } from 'node:fs';
import { z } from 'zod';

if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: z.url().parse(process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL) },
});
