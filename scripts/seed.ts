import argon2 from 'argon2';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, pool } from './connection';
import { accounts, groups } from '../src/lib/db/schema';

const passwords = z.object({ GROUP_1_PASSWORD: z.string().min(12), GROUP_2_PASSWORD: z.string().min(12), GROUP_3_PASSWORD: z.string().min(12), GROUP_4_PASSWORD: z.string().min(12), ADMIN_PASSWORD: z.string().min(12) }).parse(process.env);
async function main() {
try {
  for (let number = 1; number <= 4; number++) {
    const username = `grupo${number}`; const password = passwords[`GROUP_${number}_PASSWORD` as keyof typeof passwords];
    const [account] = await db.insert(accounts).values({ username, passwordHash: await argon2.hash(password, { type: argon2.argon2id }), role: 'GROUP' }).onConflictDoNothing().returning();
    const [stored] = account ? [account] : await db.select().from(accounts).where(eq(accounts.username, username));
    await db.insert(groups).values({ accountId: stored.id, name: `Grupo ${number}` }).onConflictDoNothing();
  }
  await db.insert(accounts).values({ username: 'admin', passwordHash: await argon2.hash(passwords.ADMIN_PASSWORD, { type: argon2.argon2id }), role: 'ADMIN' }).onConflictDoNothing();
  console.log('Accounts seeded. Existing passwords were not changed.');
} finally { await pool.end(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
