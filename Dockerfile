FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:24-alpine AS migrate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY scripts ./scripts
COPY drizzle ./drizzle
COPY src/lib/db/schema.ts ./src/lib/db/schema.ts
COPY src/lib/db/connection-options.ts ./src/lib/db/connection-options.ts
COPY src/lib/group-names.ts ./src/lib/group-names.ts
USER node
CMD ["sh", "-c", "node --import tsx scripts/migrate.ts && node --import tsx scripts/seed.ts"]

FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm typecheck && pnpm lint && pnpm build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/private-assets ./private-assets
USER node
EXPOSE 3000
CMD ["node", "server.js"]
