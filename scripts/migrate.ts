import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './connection';

async function main() {
  try { await migrate(db, { migrationsFolder: './drizzle' }); console.log('Migrations applied.'); }
  finally { await pool.end(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
