import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { accounts, groups, sessions } from '@/lib/db/schema';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function login(username: string, password: string) {
  const [account] = await db.select().from(accounts).where(eq(accounts.username, username));
  if (!account || !(await argon2.verify(account.passwordHash, password))) return null;
  const token = randomBytes(32).toString('base64url');
  const [session] = await db.insert(sessions).values({ accountId: account.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) }).returning({ id: sessions.id });
  return { token, sessionId: session.id, role: account.role };
}

export async function authenticate(request: Request) {
  const header = request.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [row] = await db.select({ session: sessions, account: accounts }).from(sessions).innerJoin(accounts, eq(sessions.accountId, accounts.id)).where(and(eq(sessions.tokenHash, hashToken(token)), isNull(sessions.revokedAt), gt(sessions.expiresAt, sql`now()`)));
  if (!row) return null;
  await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, row.session.id));
  const [group] = row.account.role === 'GROUP' ? await db.select().from(groups).where(eq(groups.accountId, row.account.id)) : [];
  return { sessionId: row.session.id, account: row.account, group: group ?? null };
}

export async function logout(sessionId: string) {
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
}
