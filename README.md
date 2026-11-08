# Habag at Karera

Multiplayer Filipino Amazing Race game for four groups. Next.js, PostgreSQL, Drizzle, SSE, and pnpm.

## Run locally

1. Copy `.env.example` to `.env` and replace all `change-me` values. Use passwords of at least 12 characters. For a local app outside Docker, set `DATABASE_URL` to `localhost`; for Compose, set it to `db`.
2. Start PostgreSQL, then run `pnpm install`, `pnpm db:migrate`, `pnpm db:seed`, and `pnpm dev`.
3. Open `/login`. Usernames are `grupo1` through `grupo4`, and `admin`.

For a Compose deployment, `docker compose up --build` starts PostgreSQL, runs migrations and idempotent account seeding, then starts the app. Set `DATABASE_URL` to a URL using the `db` host.

## Challenge content

The game has 12 challenges: five anagrams, two picture sequences, and five Philippine places. Words, accepted answers, and hints are configured in the server-only `src/lib/server/challenges.ts`. Anagram answers ignore capitalization and surrounding whitespace. Place answers use canonical province IDs; Station 3 round 4 accepts either Leyte or Samar.

Station 2 images live in `private-assets/station-2/round-1/` and `round-2/`, numbered `1` through `5` in correct chronological order. JPEG (`.jpg` or `.jpeg`) and PNG (`.png`) files are supported. All groups receive the same fixed initial shuffle. Station 3 uses the filenames in `places`, under `private-assets/station-3/`. Authenticated image endpoints keep source filenames out of browser responses. Images are tracked in Git so CI and Docker builds include them.

Missing content blocks the station from starting. Verify content before the competition and do not change challenges during a race. The ending page displays the group's official total from its three saved station durations.

An administrator can start a new competition from the admin dashboard using **I-reset ang lahat ng grupo** and typing `RESET`. This clears all group progress, round and station timing records, and attempt limits, and returns connected players to the landing page. Accounts, passwords, and active login sessions remain available. Use this reset before replaying a race that used older challenge content.

## Checks

`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

Database integration tests run when `TEST_DATABASE_URL` points to an empty disposable PostgreSQL database named `habag_test`. They migrate that database and exercise totals, admin authorization, reset notifications, and concurrent submissions. CI provides this database automatically. Do not use a competition database for these tests.

## GitHub Actions and container images

`.github/workflows/ci.yml` runs the checks and validates the Docker build for pull requests. Pushes to `main`, tags starting with `v`, and manual workflow runs publish the app and station images to `ghcr.io/mkpautin/habag-at-karera`. Images receive branch/tag and commit tags; `latest` is updated only by `main`. Publication waits for all checks to pass.

The workflow uses `GITHUB_TOKEN` with `packages: write`; no Docker Hub credentials are required. Enable Actions and allow package publication in the repository or organization settings. See `docs/operations.md` for deployment details.
