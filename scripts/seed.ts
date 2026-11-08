import argon2 from 'argon2';
import { z } from 'zod';
import { eq, inArray } from 'drizzle-orm';
import { db, pool } from './connection';
import { accounts, groups } from '../src/lib/db/schema';
import { groupNames } from '../src/lib/group-names';

const passwords = z.object({ GROUP_1_PASSWORD: z.string().min(12), GROUP_2_PASSWORD: z.string().min(12), GROUP_3_PASSWORD: z.string().min(12), GROUP_4_PASSWORD: z.string().min(12), ADMIN_PASSWORD: z.string().min(12) }).parse(process.env);
async function main() {
  try {
    const prepared = await Promise.all(groupNames.map(async (name, index) => ({
      name,
      username: name.toLowerCase(),
      legacyUsername: `grupo${index + 1}`,
      passwordHash: await argon2.hash(passwords[`GROUP_${index + 1}_PASSWORD` as keyof typeof passwords], { type: argon2.argon2id }),
    })));
    const adminPasswordHash = await argon2.hash(passwords.ADMIN_PASSWORD, { type: argon2.argon2id });
    await db.transaction(async tx => {
      for (const { name, username, legacyUsername, passwordHash } of prepared) {
        const matches = await tx.select().from(accounts).where(inArray(accounts.username, [username, legacyUsername])).for('update');
        if (matches.length > 1) throw new Error(`Both ${legacyUsername} and ${username} exist. Resolve the duplicate accounts before seeding.`);
        let stored = matches[0];
        if (!stored) {
          const [created] = await tx.insert(accounts).values({ username, passwordHash, role: 'GROUP' }).onConflictDoNothing().returning();
          const [existing] = created ? [created] : await tx.select().from(accounts).where(eq(accounts.username, username));
          stored = existing;
        }
        if (!stored || stored.role !== 'GROUP') throw new Error(`Expected a group account for ${username}.`);
        if (stored.username !== username) await tx.update(accounts).set({ username }).where(eq(accounts.id, stored.id));
        await tx.insert(groups).values({ accountId: stored.id, name }).onConflictDoUpdate({ target: groups.accountId, set: { name } });
      }
      await tx.insert(accounts).values({ username: 'admin', passwordHash: adminPasswordHash, role: 'ADMIN' }).onConflictDoNothing();
    });
    console.log('Accounts seeded and group usernames synchronized. Existing passwords and progress were preserved.');
  } finally { await pool.end(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
