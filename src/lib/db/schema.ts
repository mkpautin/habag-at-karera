import { bigint, check, integer, pgEnum, pgTable, smallint, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const role = pgEnum('account_role', ['GROUP', 'ADMIN']);
export const phase = pgEnum('game_phase', ['LANDING', 'STATION_1', 'STATION_2', 'STATION_3', 'FINISHED']);

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 80 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: role('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  tokenHash: text('token_hash').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}).enableRLS();

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().unique().references(() => accounts.id),
  name: varchar('name', { length: 80 }).notNull(),
  phase: phase('phase').notNull().default('LANDING'),
  currentRound: smallint('current_round').notNull().default(0),
  version: integer('version').notNull().default(0),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
}, (table) => [check('groups_round_check', sql`${table.currentRound} between 0 and 5`)]).enableRLS();

export const stationRuns = pgTable('station_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id),
  stationNumber: smallint('station_number').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  elapsedMs: bigint('elapsed_ms', { mode: 'number' }),
}, (table) => [uniqueIndex('station_group_number').on(table.groupId, table.stationNumber), check('station_number_check', sql`${table.stationNumber} between 1 and 3`)]).enableRLS();

export const roundRuns = pgTable('round_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id),
  stationNumber: smallint('station_number').notNull(),
  roundNumber: smallint('round_number').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => [uniqueIndex('round_group_station_number').on(table.groupId, table.stationNumber, table.roundNumber)]).enableRLS();

export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
  count: integer('count').notNull().default(0),
}).enableRLS();
