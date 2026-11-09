# Habag at Karera

Multiplayer Filipino Amazing Race game for four groups. Next.js, PostgreSQL, Drizzle, SSE, and pnpm.

## Deploy to Vercel

The repository supports Vercel with hosted PostgreSQL. Follow [docs/vercel.md](docs/vercel.md) to provision the database, apply migrations and seed accounts, import the repository, and configure `DATABASE_URL`. Vercel hosts the app directly, without Docker or Caddy. On Vercel, group and admin updates poll every two seconds; Docker hosting retains SSE. Official progress and times remain in PostgreSQL.

## Run locally

1. Copy `.env.example` to `.env` and replace all `change-me` values. Use passwords of at least 12 characters. For a local app outside Docker, set `DATABASE_URL` to `localhost`; for Compose, set it to `db`.
2. Start PostgreSQL, then run `pnpm install`, `pnpm db:migrate`, `pnpm db:seed`, and `pnpm dev`.
3. Open `/` for the public introduction and station previews, then `/login` to join. Group accounts use the following mapping; the administrator username is `admin`.

| Group | Username | Password variable |
| --- | --- | --- |
| Amihan | `amihan` | `GROUP_1_PASSWORD` |
| Buhawi | `buhawi` | `GROUP_2_PASSWORD` |
| Daluyong | `daluyong` | `GROUP_3_PASSWORD` |
| Sigwa | `sigwa` | `GROUP_4_PASSWORD` |

Rerun `pnpm db:seed` to synchronize names and usernames for existing groups. It renames `grupo1`–`grupo4` to the lowercase names above on the same account records, preserving passwords, sessions, timing records, and progress. Compose also runs this seed during setup. After seeding, use the new usernames to log in. If both a legacy account and its new username already exist, seeding stops without changing accounts so the conflict can be resolved explicitly.

For a Compose deployment, set `DATABASE_URL` to a URL using the `db` host, then run `docker compose pull` and `docker compose up -d --no-build`. Both the app and its migration/seed service use prebuilt GHCR images. Wait for the updated GitHub workflow to publish both images first. See [docs/deployment.md](docs/deployment.md) for VM setup, registry authentication, and update commands.

To build images on your development machine instead, use `docker compose -f compose.yaml -f compose.build.yaml up -d --build`.

## Challenge content

The game has 12 challenges: five anagrams, two picture sequences, and five Philippine places. Words, accepted answers, and hints are configured in the server-only `src/lib/server/challenges.ts`. Anagram answers ignore capitalization and surrounding whitespace. Place answers use canonical province IDs; Station 3 round 4 accepts either Leyte or Samar.

The authenticated pre-game screen shows Tagalog instructions before the MAGLARO button. The public landing page previews the three stations without starting a timer. Players see their group, current station, and round progress throughout the race. The interface uses a cream notebook theme with distinct station colors, keyboard focus states, mobile layouts, and reduced-motion support. A copyable announcement with access and troubleshooting instructions is available in [docs/player-announcement.md](docs/player-announcement.md); replace its game-link placeholder before posting.

Station 2 images live in `private-assets/station-2/round-1/` and `round-2/`, numbered `1` through `5` in correct chronological order. JPEG (`.jpg` or `.jpeg`) and PNG (`.png`) files are supported. All groups receive the same fixed initial shuffle. Station 3 uses the filenames in `places`, under `private-assets/station-3/`. Authenticated image endpoints keep source filenames out of browser responses. Images are tracked in Git so CI and Docker builds include them.

Missing content blocks the station from starting. Verify content before the competition and do not change challenges during a race. The ending page displays the group's official total from its three saved station durations.

An administrator can start a new competition from the admin dashboard using **I-reset ang lahat ng grupo** and typing `RESET`. This clears all group progress, round and station timing records, and attempt limits, and returns connected players to the landing page. Accounts, passwords, and active login sessions remain available. Use this reset before replaying a race that used older challenge content.

## Checks

`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

Database integration tests run when `TEST_DATABASE_URL` points to an empty disposable PostgreSQL database named `habag_test`. They migrate that database and exercise totals, admin authorization, reset notifications, and concurrent submissions. CI provides this database automatically. Do not use a competition database for these tests.

## GitHub Actions and container images

`.github/workflows/ci.yml` runs the checks and validates both Docker targets for pull requests. Pushes to `main`, tags starting with `v`, and manual workflow runs publish the runtime and migration images to `ghcr.io/mkpautin/habag-at-karera`. The migration tags have a `-migrate` suffix; for example, `latest` and `latest-migrate`. Images receive branch/tag and commit tags; the latest pair is updated only by `main`. Publication waits for all checks to pass.

The workflow uses `GITHUB_TOKEN` with `packages: write`; no Docker Hub credentials are required. Enable Actions and allow package publication in the repository or organization settings. See `docs/operations.md` for deployment details.
