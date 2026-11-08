# Drizzle migrations guidance

This scope covers generated SQL migrations, metadata, and snapshots in `drizzle/`.

- Generate migrations from intentional schema changes using the project's configured Drizzle Kit scripts. Inspect generated SQL before applying it.
- Keep migrations ordered, deterministic, and safe for existing data. For risky changes, use an expand-and-contract sequence and plan backfills separately.
- Do not rewrite an already-applied migration to change deployed behavior; add a follow-up migration instead.
- Preserve migration journal and snapshot consistency. Avoid hand-editing generated metadata unless repairing it deliberately and reviewing the diff.
- Test migrations against a disposable local PostgreSQL database when the project setup supports it. Document compatibility or rollout constraints.
- Never put credentials or production data in migration files.
