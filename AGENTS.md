# Project guidance

This repository is intended for a Next.js application written in TypeScript, with PostgreSQL, Drizzle ORM, Tailwind CSS, Oxlint, Zod, and Docker. The workspace may be only partially scaffolded; confirm the files and scripts that actually exist before relying on a convention below.

## Working agreements

- Follow the existing App Router structure under `src/app/`. Keep route entry points small and move reusable UI and server logic into their appropriate modules.
- Keep TypeScript strict. Prefer inferred types from schemas and database definitions over duplicated handwritten types. Avoid `any`; validate data at trust boundaries.
- Treat Server Components as the default. Add `'use client'` only when browser state, effects, or event handlers require it. Keep secrets and database access on the server.
- Validate request bodies, query parameters, environment variables, and other external input with Zod. Return useful, non-sensitive errors.
- Access PostgreSQL through the shared Drizzle setup in `src/lib/db/`. Use parameterized/query-builder operations; do not concatenate untrusted SQL.
- Make schema changes through reviewed Drizzle migrations. Do not edit generated migration snapshots casually or use production data to test migrations.
- Use Tailwind utilities consistent with the existing design patterns. Keep class composition readable and extract repeated UI patterns when that improves clarity.
- Use Oxlint and the package scripts already present. Do not assume a package manager or invent commands; inspect `package.json` and lockfiles first.
- Keep Docker images reproducible and minimal. Never bake credentials into an image or commit real secrets; use documented environment variables and secret injection.
- Update relevant documentation when behavior, setup, environment variables, schema, or deployment changes.

## Verification

Before finishing a code change, inspect the applicable package scripts and run the narrowest relevant checks when requested or appropriate. Report checks that could not be run. Do not claim a command passed unless it was run successfully.

## More detailed guidance

- `src/app/AGENTS.md`: routes, layouts, server/client boundaries, and handlers.
- `src/components/AGENTS.md`: reusable UI and Tailwind conventions.
- `src/lib/AGENTS.md`: shared utilities, validation, and server-only boundaries.
- `src/lib/db/AGENTS.md`: Drizzle schema, queries, and transactions.
- `drizzle/AGENTS.md`: migration and snapshot workflow.
- `scripts/AGENTS.md`: operational and maintenance scripts.
- `docs/architecture.md`: suggested application boundaries.
- `docs/database.md`: PostgreSQL and migration practices.
- `docs/operations.md`: environment, Docker, and deployment notes.
