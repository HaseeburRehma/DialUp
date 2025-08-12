# syntax=docker/dockerfile:1

############################
# 1) Install dev dependencies
############################
FROM node:20-bookworm-slim AS deps-dev
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_LEGACY_PEER_DEPS=true

# Copy package manifests first for caching
COPY package*.json ./

# Install build tools for node-gyp dependencies (bcrypt, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ pkg-config \
 && rm -rf /var/lib/apt/lists/*

RUN npm ci

############################
# 2) Build Next.js + server
############################
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .

ARG MONGODB_URI
ENV MONGODB_URI=$MONGODB_URI

RUN npm run build

############################
# 3) Install production deps only
############################
FROM node:20-bookworm-slim AS deps-prod
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

############################
# 4) Runtime (non-root)
############################
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Use Railway's PORT env or default to 3000
ENV PORT=${PORT:-3000}

# Copy built app + production deps
COPY --chown=nonroot:nonroot --from=build     /app/.next        ./.next
COPY --chown=nonroot:nonroot --from=build     /app/public       ./public
COPY --chown=nonroot:nonroot --from=deps-prod /app/node_modules ./node_modules
COPY --chown=nonroot:nonroot --from=build     /app/package*.json ./
COPY --chown=nonroot:nonroot --from=build     /app/server       ./server

# Healthcheck for Railway
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}

# Distroless image has node as entrypoint
CMD ["server/index.js"]
