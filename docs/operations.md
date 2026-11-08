# Local development and operations

## Environment

Document required variables in an `.env.example` file using placeholder values only. Validate application configuration at startup with Zod. Never commit real credentials, expose server-only variables with a `NEXT_PUBLIC_` prefix, or include secrets in Docker build arguments or image layers.

## Docker

Use a reproducible multi-stage image when appropriate: install from the lockfile, build in a build stage, and run the smallest practical production image as a non-root user. Keep build-time and runtime configuration distinct. Add a health check only when it reflects application readiness accurately.

For local PostgreSQL, a Compose service may provide a disposable database with a named volume and health check. Keep local credentials clearly non-production and document how to reset local data.

## Commands

Package scripts and the lockfile are authoritative. Before documenting commands, confirm the actual package manager and available scripts in `package.json`. Typical tasks include development, linting with Oxlint, type checking, building, migration generation, and migration application, but their exact names are project-specific.

## Deployment

Apply migrations through a deliberate release step, not concurrently from every application replica. Provide secrets through the platform's secret manager. Confirm runtime health and migration status after deployment, and keep rollback or forward-fix steps available for schema changes.

The project uses pnpm 12 and the scripts listed in `package.json`. Set `DATABASE_URL`, four `GROUP_N_PASSWORD` values, and `ADMIN_PASSWORD` from `.env.example`. `pnpm db:seed` creates missing accounts and groups without resetting progress or changing existing passwords. Rerunning seed does not rotate passwords.

Compose provides PostgreSQL, a one-shot migration/seed service, and the standalone Next.js app. The app starts only after migration and seed complete. Use a reverse proxy with HTTPS and SSE buffering disabled for public deployment. Keep the database private and retain its volume between releases.
