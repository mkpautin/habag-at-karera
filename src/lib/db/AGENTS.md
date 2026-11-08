# Database code guidance

This scope covers the Drizzle client, schema definitions, repositories, and PostgreSQL queries under `src/lib/db/`.

- Keep one configured database client/pool per runtime process according to the chosen Drizzle PostgreSQL driver and deployment model.
- Define tables, indexes, constraints, relations, and inferred row/insert types in the established schema modules. Use explicit constraints for important invariants.
- Keep queries parameterized through Drizzle. For raw SQL, use parameter binding and document why the query builder is insufficient.
- Put multi-step writes that must succeed together in a transaction. Keep transactions short and avoid external network calls inside them.
- Select only required columns where practical. Paginate potentially large result sets and consider indexes for real query patterns.
- Never log credentials, connection strings, or sensitive row contents. Map database errors to safe application errors at the boundary.
- Coordinate schema edits with migrations in `drizzle/`; do not rely on runtime schema mutation.
