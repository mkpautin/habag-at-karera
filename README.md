# Habag at Karera

Multiplayer Filipino Amazing Race game for four groups. Next.js, PostgreSQL, Drizzle, SSE, and pnpm.

## Run locally

1. Copy `.env.example` to `.env` and replace all `change-me` values. Use passwords of at least 12 characters. For a local app outside Docker, set `DATABASE_URL` to `localhost`; for Compose, set it to `db`.
2. Start PostgreSQL, then run `pnpm install`, `pnpm db:migrate`, `pnpm db:seed`, and `pnpm dev`.
3. Open `/login`. Usernames are `grupo1` through `grupo4`, and `admin`.

For a Compose deployment, `docker compose up --build` starts PostgreSQL, runs migrations and idempotent account seeding, then starts the app. Set `DATABASE_URL` to a URL using the `db` host.

## Challenge content

The competition is intentionally blocked at stations whose content is missing. Add three records to `src/lib/server/challenges.ts` `anagrams`, and five records to `places`. Each place needs an opaque image filename, a province ID from `src/lib/provinces.ts`, and a hint. Put place images in `private-assets/station-3/`.

Put Station 2 JPEG images in `private-assets/station-2/round-1/` and `round-2/`, named `1.jpg` to `5.jpg` in correct chronological order. All groups receive the same fixed initial shuffle. The source filenames are never sent to the browser.

Before competition, fill in and verify all content, then run the checks below. Do not change challenges during a race.

## Checks

`pnpm typecheck`, `pnpm lint`, `pnpm build`.
