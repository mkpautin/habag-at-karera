# Deploying to Vercel

Vercel hosts the Next.js frontend and Node.js API functions. PostgreSQL must be hosted separately and reachable from Vercel. Docker, Caddy, and the Azure VM are not part of this deployment.

## 1. Prepare PostgreSQL

Create or connect a hosted PostgreSQL database through the [Vercel Marketplace](https://vercel.com/docs/postgres) or another provider. Use the provider's connection strings, including its TLS settings. For serverless deployments, use its pooled connection URL as `DATABASE_URL` and its direct connection URL for operational scripts.

The app still requires PostgreSQL transactions, row locks, and database timestamps. Do not use the Compose hostname `db` or `localhost` in Vercel's database URL.

### Supabase

Create a Supabase project and open its **Connect** dialog. Copy the full shared pooler connection strings; the pooler hostname depends on your project and region.

| Setting | Supabase connection | Where to set it |
| --- | --- | --- |
| `DATABASE_URL` | Transaction pooler, port **6543** | Local `.env` and Vercel Production |
| `DIRECT_DATABASE_URL` | Session pooler, port **5432** | Local `.env` for migration and seed scripts |

For example, replace every placeholder using the connection strings from Connect:

```dotenv
DATABASE_URL=postgresql://postgres.PROJECT_REF:ENCODED_DATABASE_PASSWORD@POOLER_HOST:6543/postgres?sslmode=require
DIRECT_DATABASE_URL=postgresql://postgres.PROJECT_REF:ENCODED_DATABASE_PASSWORD@POOLER_HOST:5432/postgres?sslmode=require
```

Use your project's **database password**, and URL-encode special characters in the password when constructing a URL. Keep both URLs secret. The app uses its own group/admin authentication; Supabase Auth, a publishable/anon key, and a service-role API key are not needed.

If login or migrations fail with `SELF_SIGNED_CERT_IN_CHAIN`, download your project's **server root certificate** from Supabase's Database Settings → SSL Configuration. In Vercel → Settings → Environment Variables, add **`DATABASE_SSL_CA`** for Production and paste the entire PEM certificate, including `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`, with its line breaks. Then redeploy. The certificate contents belong in this variable, not a local filename. See [Supabase's SSL guide](https://supabase.com/docs/guides/platform/ssl-enforcement).

For local migration and seed commands, the same certificate can be set in `.env` as a quoted value with escaped newlines:

```dotenv
DATABASE_SSL_CA="-----BEGIN CERTIFICATE-----\nREPLACE_WITH_CERTIFICATE_BODY\n-----END CERTIFICATE-----"
```

The server and migration/seed scripts use this CA with certificate and hostname verification enabled. With `DATABASE_SSL_CA` set, the app removes URL SSL parameters before passing its explicit TLS configuration to `pg`, so URL options cannot overwrite the CA. Without it, existing connection-string SSL settings apply. `sslmode=verify-full` makes the intended verification explicit and avoids the driver's `sslmode=require` warning. A local `NODE_EXTRA_CA_CERTS` terminal export does not configure Vercel; each deployment needs its own trust configuration. Never set `NODE_TLS_REJECT_UNAUTHORIZED=0` to resolve this error.

Despite the variable name, `DIRECT_DATABASE_URL` can use the Session pooler: scripts need a session-compatible connection, and this option supports IPv4. Supabase's direct `db.PROJECT_REF.supabase.co` connection normally requires IPv6 unless your project has IPv4 support. See Supabase's [connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres).

Use the provided `postgres` database user for migrations and the application so it owns the game tables and can access them with row-level security enabled. The migration enables RLS on all six game tables without browser-role policies, preventing Data API clients from reading or changing accounts, sessions, or game state. Player authorization happens in the app's server API. Do not add public access policies for these tables. A custom runtime database role would need appropriate ownership or `BYPASSRLS`; the `anon` and `authenticated` roles are not runtime database credentials. See [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

Continue below to migrate and seed before deploying. Select a Vercel function region close to your Supabase project.

A new database starts a new competition. To retain existing accounts and results, restore a PostgreSQL backup from the VM into the hosted database before applying migrations and seeding.

## 2. Apply migrations and seed accounts

On your local development machine, configure `.env` for the hosted database:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@POOLED_HOST/DATABASE?sslmode=require
DIRECT_DATABASE_URL=postgresql://USER:PASSWORD@DIRECT_HOST/DATABASE?sslmode=require
GROUP_1_PASSWORD=REPLACE_WITH_AMIHAN_PASSWORD
GROUP_2_PASSWORD=REPLACE_WITH_BUHAWI_PASSWORD
GROUP_3_PASSWORD=REPLACE_WITH_DALUYONG_PASSWORD
GROUP_4_PASSWORD=REPLACE_WITH_SIGWA_PASSWORD
ADMIN_PASSWORD=REPLACE_WITH_ADMIN_PASSWORD
```

Use the actual URLs supplied by your provider. `DIRECT_DATABASE_URL` is optional; scripts fall back to `DATABASE_URL` if it is empty. Password values must have at least 12 characters. Then run:

```bash
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm db:seed
```

These commands target the database in your local environment file. Seeding creates `amihan`, `buhawi`, `daluyong`, `sigwa`, and `admin`, preserving existing passwords and progress. It also upgrades the previous numbered group usernames when present.

Migrations and seeding deliberately do not run during `pnpm build` or API requests. Run migrations once as a release step before promoting an app version that needs them. Preview deployments should use a separate database or database branch.

## 3. Import the GitHub repository

Push the committed changes and import the repository into Vercel with the repository root as the project directory. The checked-in configuration selects Next.js, Node.js 24, pnpm installation with a frozen lockfile, and `pnpm build`.

In Vercel's project environment settings, set **DATABASE_URL** to the hosted database's pooled URL for Production. Give Preview and Development their own database URLs when needed. Redeploy after changing environment variables. Account seed passwords and `DIRECT_DATABASE_URL` are needed by the operational scripts, not by the application's runtime.

Keep Fluid Compute enabled for database-pool lifecycle management, and choose a function region near the database in project settings. The pool is reused within each instance and registered with Vercel's [database connection lifecycle helper](https://vercel.com/kb/guide/connection-pooling-with-functions).

## 4. Verify the deployed game

Open the production `.vercel.app` URL and check:

- The public page, fonts, and login form load.
- Each group can log in with its assigned credentials.
- Two devices using the same group see shared progress and station changes within roughly two seconds, plus request latency.
- Both picture stations display images, including the PNG source image in Station 2.
- The ending page shows the saved total, and only the admin can view results or reset the competition.

Use Vercel's function logs to investigate database errors. If tables are missing, apply the migrations to the same database named in Production's `DATABASE_URL`. If login fails after changing a seed password, remember that seeding preserves passwords for existing accounts.

## Runtime adaptations

On Vercel, authenticated events endpoints return a short polling configuration. Clients fetch authoritative state every two seconds, await each refresh, and stop when the page is closed. This avoids holding a PostgreSQL `LISTEN` connection or a function invocation open for the race. Docker hosting retains SSE. Official timing, answer validation, stale-request checks, and reset authorization remain on the server.

Polling generates regular function and database requests while players are connected. Monitor usage and database capacity for the actual participant count. Browser background-tab scheduling and network delays can make visible updates take longer; the database records official times independently.

Private station assets are included in API function traces and remain behind authenticated endpoints. Images are resized to at most 1600×1200 and served as WebP, so the original 8.6 MB PNG does not exceed Vercel's [buffered response limit](https://vercel.com/docs/functions/limitations#request-body-size). Image buffers may be cached within an instance; no game progress or timing depends on that cache.

CI builds both Docker-compatible and Vercel configurations. `pnpm verify:vercel` checks that the state and image route traces include all 15 station images and exclude local environment files. To reproduce the Vercel build locally on a POSIX shell:

```bash
VERCEL=1 pnpm build
pnpm verify:vercel
```

This checks the framework build and packaging locally; a deployment in your Vercel account still needs your hosted database and project settings.

## 5. Add the custom domain

First verify the generated `.vercel.app` URL. Then add `habagat.mkpp.tech` under the project's Domains settings and update DNS using the exact record Vercel displays. Vercel manages HTTPS for the deployment. See the [custom domain guide](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

Old DNS answers can remain cached on campus or ISP resolvers after the switch. Verify the `.vercel.app` URL separately from the custom domain while DNS changes propagate.
