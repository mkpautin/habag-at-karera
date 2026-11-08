# Database practices

Use PostgreSQL as the durable source of truth and Drizzle ORM for schema and application queries. Keep the connection configuration centralized and server-only. Read database credentials from environment variables or the deployment secret store.

## Schema changes

1. Update the Drizzle schema and its constraints/indexes.
2. Generate a migration with the configured project command.
3. Review the SQL for locks, data loss, defaults, and compatibility with current application versions.
4. Apply it to a disposable local database and verify the resulting schema when feasible.
5. Commit the schema and migration metadata together.

For production-safe changes, add new nullable structures first, deploy compatible application code, backfill in a controlled job, and remove obsolete structures in a later release. Do not put large or unbounded data rewrites into a deployment-time migration without an explicit operational plan.

Prefer database constraints for invariants that must hold across all writers. Use transactions for related writes, and design retry behavior with PostgreSQL's transaction and uniqueness semantics in mind.

Initial migrations are in `drizzle/0000_dry_madame_web.sql` and `drizzle/0001_needy_zaran.sql`. `groups.version` rejects stale progress requests. `station_runs` and `round_runs` have unique group/station/round keys. `rate_limits` stores short request windows for login and answer attempts. Run `pnpm db:generate` after intentional schema changes, inspect the SQL, and apply with `pnpm db:migrate`.
