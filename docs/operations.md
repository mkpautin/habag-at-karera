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

## CI and image publication

The `CI and Docker` workflow runs on pull requests, pushes to `main`, `v*` tags, and manual dispatch. Its checks job installs the pinned pnpm version with a frozen lockfile, then runs lint, type checking, challenge tests, and the production build. The Docker job depends on those checks and builds a Linux amd64 image. Pull requests build without registry login or publication.

Other triggers publish to `ghcr.io/<repository-owner>/<repository-name>` using the built-in `GITHUB_TOKEN` and the Docker job's `packages: write` permission. For this repository the image is `ghcr.io/mkpautin/habag-at-karera`. Branch, version tag, and `sha-<commit>` tags identify builds; `latest` follows `main` only. The image includes the tracked station assets. The workflow follows the [GitHub Container Registry publishing guide](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images).

Enable GitHub Actions for the repository and permit package publication under organization policy if applicable. An existing package must grant this repository Actions access. Package visibility is managed in GitHub Packages; private image pulls require registry credentials with package read access. The workflow does not require a personal token for publishing.

To deploy a published image, set the Compose app service's `image` to a published tag (for example `ghcr.io/mkpautin/habag-at-karera:latest`) and remove its `build` entry. Keep the migration service and its source checkout for applying migrations and seeding. Supply `DATABASE_URL` and account credentials at runtime as before; application secrets are not GitHub Actions build inputs.
