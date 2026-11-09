# Application architecture

Vercel deployments use hosted PostgreSQL and short authenticated polling requests; Docker deployments retain PostgreSQL LISTEN/NOTIFY and SSE. The events endpoints select polling when `VERCEL=1`. Both transports reconcile through the same authoritative game-state APIs and transactional engine. Official timing never depends on client polling intervals.

API function tracing explicitly includes private station assets. Authenticated asset handlers resize and encode images as WebP before returning them, including large PNG source files. Database pools are reused per runtime and registered with Vercel's lifecycle helper on the platform. See [vercel.md](vercel.md) for setup.

This document describes a suggested starting structure. Adapt it to the repository as it is scaffolded.

```text
src/
  app/          Next.js App Router routes and layouts
  components/   Shared UI components
  lib/          Domain logic, validation, and infrastructure helpers
    db/         Drizzle client, schema, and data access
drizzle/        Generated SQL migrations and Drizzle metadata
scripts/        Local development and operational scripts
```

Keep route composition in `src/app`, reusable presentation in `src/components`, and business rules in `src/lib`. Keep database code server-only. Validate untrusted input at the boundary with Zod, then pass typed values to domain and data-access functions. Keep authorization close to protected server operations so every entry point enforces it.

The game engine is in `src/lib/server/game.ts`. It locks each group row for progress changes, stores station and round timestamps in PostgreSQL, and emits `pg_notify` inside the transaction. Authenticated SSE endpoints notify clients to refetch authoritative state. Browser sessions use tab-scoped `sessionStorage`; each login creates a distinct server session. Challenge solutions remain in server-only modules and private image sources use authenticated asset handlers.

Use Server Components for read-oriented UI by default. Use client-side code only for interactions that need browser capabilities. Prefer explicit module boundaries over a large generic utilities directory.
