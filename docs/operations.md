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

The project uses pnpm 12 and the scripts listed in `package.json`. Set `DATABASE_URL`, four `GROUP_N_PASSWORD` values, and `ADMIN_PASSWORD` from `.env.example`. `pnpm db:seed` creates missing accounts and groups and synchronizes group identities: `amihan` → Amihan, `buhawi` → Buhawi, `daluyong` → Daluyong, `sigwa` → Sigwa. The password variables retain their numbered mapping in that order. Existing `grupo1`–`grupo4` accounts are renamed on the same records, preserving their IDs, passwords, sessions, progress, and timing records. The administrator username remains `admin`.

The seed applies the account and group updates in one transaction. Rerunning it does not rotate passwords or create duplicate groups. If a legacy username and its corresponding new username both exist, it stops and rolls back rather than merging accounts or choosing which progress to retain. Resolve that conflict explicitly before rerunning. Use the lowercase group usernames after applying the seed.

Compose provides PostgreSQL, a one-shot migration/seed service, and the standalone Next.js app. The default configuration uses prebuilt images for both application services; run `docker compose pull` followed by `docker compose up -d --no-build`. The app starts only after migration and seed complete. Use a reverse proxy with HTTPS and SSE buffering disabled for public deployment. Keep the database private and retain its volume between releases. See [deployment.md](deployment.md) for the full Azure VM procedure and the optional local build override.

## Resetting a competition

Log in as `admin`, select **I-reset ang lahat ng grupo**, and type `RESET` to confirm. `POST /api/admin/reset` requires an administrator session and this confirmation. One transaction locks all group rows, removes station and round timing records, clears request-limit windows, and returns every group to `LANDING` with round zero and no finish timestamp. Saved results are cleared; accounts and sessions are retained. Resetting does not change credentials.

The reset publishes a notification for each group after commit so active clients return to the landing page. State versions continue increasing so requests from the previous race cannot advance the new race. Game-state reads use a consistent database snapshot, including the three-station total shown on the ending page.

## CI and image publication

The `CI and Docker` workflow runs on pull requests, pushes to `main`, `v*` tags, and manual dispatch. Its checks job installs the pinned pnpm version with a frozen lockfile, then runs lint, type checking, challenge and database integration tests, and the production build. A disposable PostgreSQL service supplies `TEST_DATABASE_URL` for the integration tests. Docker jobs depend on those checks and build Linux amd64 images for the `runtime` and `migrate` targets. Pull requests build without registry login or publication.

Other triggers publish to `ghcr.io/<repository-owner>/<repository-name>` using the built-in `GITHUB_TOKEN` and the Docker job's `packages: write` permission. For this repository the image is `ghcr.io/mkpautin/habag-at-karera`. Branch, version tag, and `sha-<commit>` tags identify builds; `latest` follows `main` only. Migration images use the same tags with a `-migrate` suffix and separate build-cache scopes. The runtime image includes the tracked station assets and public fonts; the migration image contains scripts, schema, migrations, and dependencies. The workflow follows the [GitHub Container Registry publishing guide](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images).

Enable GitHub Actions for the repository and permit package publication under organization policy if applicable. An existing package must grant this repository Actions access. Package visibility is managed in GitHub Packages; private image pulls require registry credentials with package read access. The workflow does not require a personal token for publishing.

Set `IMAGE_REPOSITORY` and `IMAGE_TAG` in `.env` to select a published release; Compose uses the matching `-migrate` tag for migration and seed. Neither service builds on the VM or downloads pnpm at startup. Supply `DATABASE_URL` and account credentials at runtime as before; application secrets are not GitHub Actions build inputs. Seeding computes Argon2 hashes one at a time to keep memory use lower on small VMs. To build on a development machine, add `-f compose.build.yaml` after `-f compose.yaml` when invoking Compose.
