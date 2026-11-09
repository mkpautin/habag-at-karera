# Deploying prebuilt images on an Azure VM

For deployment without a VM, Docker, or Caddy, use the [Vercel guide](vercel.md) instead.

The default `compose.yaml` pulls images. Neither the application nor the migration service has a build definition, so this deployment does not compile Next.js or install dependencies on the VM. The migration image already contains its dependencies, scripts, and Drizzle migrations. The app image includes the standalone server, public fonts, and private station assets.

## Publish both images first

Push the deployment changes to `main`, then wait for the entire **CI and Docker** workflow to succeed. It publishes two Docker targets to the same GHCR repository:

| Purpose | Main branch image |
| --- | --- |
| Application | `ghcr.io/mkpautin/habag-at-karera:latest` |
| Migrations and seeding | `ghcr.io/mkpautin/habag-at-karera:latest-migrate` |

The same pairing applies to branch, version, and commit tags: for example, `sha-abcdef0` and `sha-abcdef0-migrate`. For a fixed release, set `IMAGE_TAG=sha-abcdef0` using the seven-character commit tag from a fully successful workflow. Compose adds `-migrate` automatically for the migration service. The published platform is Linux amd64.

## Configure the VM

Keep the existing repository directory and Compose project name when switching an existing installation, so Compose continues using the same PostgreSQL volume. Pull the committed configuration:

```bash
git pull --ff-only
```

Keep your existing `.env`. For a new installation, copy `.env.example` to `.env`, replace the password placeholders, and set `DATABASE_URL` to use the Compose database hostname `db`. The database password in the URL must match `POSTGRES_PASSWORD`. Group and administrator passwords must have at least 12 characters.

These optional image settings default to this repository's published main-branch images:

```dotenv
IMAGE_REPOSITORY=ghcr.io/mkpautin/habag-at-karera
IMAGE_TAG=latest
APP_PORT=3000
```

Keep the VM's existing HTTPS/reverse-proxy configuration. The application still listens on container port 3000; `APP_PORT` controls its published host port. PostgreSQL remains private on the Compose network.

If the GHCR package is private, authenticate on the VM using a GitHub personal access token (classic) with `read:packages` and access to the package. Enter the token at Docker's password prompt:

```bash
sudo docker login ghcr.io -u YOUR_GITHUB_USERNAME
```

Public images can be pulled anonymously. See the [GitHub Container Registry authentication guide](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry).

## Start or update the application

After both images have been published:

```bash
sudo docker compose pull
sudo docker compose up -d --no-build
sudo docker compose ps -a
sudo docker compose logs --tail=100 migrate app
```

`pull` downloads the images; `up --no-build` starts them without a local build. PostgreSQL becomes healthy first, the one-shot migration service applies migrations and seeds accounts, and the app starts after that service exits successfully. The migration container showing **Exited (0)** is expected. A failed migration or seed prevents the application from starting.

If `latest-migrate` cannot be found, wait for the updated workflow's migration job to publish it. Older workflows published only the app image. For authentication errors, check GHCR access to the package. For a migration failure, inspect the migration logs before retrying.

This removes build-time memory demand from the VM. Ubuntu, PostgreSQL, and the application still share the VM's RAM; check actual usage with `sudo docker stats --no-stream`. Seeding hashes passwords sequentially to reduce its peak memory demand.

The named `postgres_data` volume retains accounts, progress, and times. Preserve it between deployments. Take a database backup before applying new migrations; selecting an older image tag does not reverse database migrations.

## Build locally when needed

On a development machine with enough memory, explicitly enable the build override:

```bash
docker compose -f compose.yaml -f compose.build.yaml up -d --build
```

The override builds the `runtime` and `migrate` targets locally. Use the base Compose file alone on the VM. Application development outside Docker still uses the existing pnpm scripts.
