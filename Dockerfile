# syntax=docker/dockerfile:1

############################
# 1) Dependencies (dev)
############################
FROM node:20-bookworm-slim AS deps-dev
WORKDIR /app

# Keep Next quiet and relax peer deps resolution (same as --legacy-peer-deps)
ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_LEGACY_PEER_DEPS=true

# Only manifests for caching
COPY package*.json ./

# Toolchain for node-gyp builds (if any): bcrypt, sharp, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ pkg-config \
 && rm -rf /var/lib/apt/lists/*

# Install all deps (incl dev) for the build step
RUN npm ci

############################
# 2) Build Next.js
############################
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .
# Runs: "npm run server:build && next build"
RUN npm run build

############################
# 3) Production deps only
############################
FROM node:20-bookworm-slim AS deps-prod
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

############################
# 4) Runtime (distroless, non-root)
############################
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Minimal runtime payload
COPY --chown=nonroot:nonroot --from=build     /app/.next        ./.next
COPY --chown=nonroot:nonroot --from=build     /app/public       ./public
COPY --chown=nonroot:nonroot --from=deps-prod /app/node_modules ./node_modules
COPY --chown=nonroot:nonroot --from=build     /app/package*.json ./
COPY --chown=nonroot:nonroot --from=build     /app/server       ./server

# Distroless has "node" as entrypoint; run your custom server directly
EXPOSE 3000
CMD ["server/index.js"]
