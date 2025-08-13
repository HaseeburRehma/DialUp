# syntax=docker/dockerfile:1

############################
# 1) Install dev dependencies (Node + Python)
############################
FROM node:20-bookworm-slim AS deps-dev
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_LEGACY_PEER_DEPS=true

# Install build tools for node-gyp + Python 3 + pip + ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv make g++ pkg-config ffmpeg wget \
 && rm -rf /var/lib/apt/lists/*

# Copy package manifests for Node
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Install Python dependencies for WhisperLive (dev)
COPY server/requirement.txt ./server/requirement.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements
RUN pip3 install --no-cache-dir \
    -r server/requirement.txt \
    -r server/WhisperLive/requirements/client.txt \
    -r server/WhisperLive/requirements/server.txt

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

# Install prod dependencies for Node
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Install Python + WhisperLive for prod
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip ffmpeg wget \
 && rm -rf /var/lib/apt/lists/*

COPY server/requirement.txt ./server/requirement.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements
RUN pip3 install --no-cache-dir \
    -r server/requirement.txt \
    -r server/WhisperLive/requirements/client.txt \
    -r server/WhisperLive/requirements/server.txt

############################
# 4) Runtime (non-root) — run Node + WhisperLive
############################
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=${PORT:-3000}

# Copy built app + production deps
COPY --chown=nonroot:nonroot --from=build     /app/.next        ./.next
COPY --chown=nonroot:nonroot --from=build     /app/public       ./public
COPY --chown=nonroot:nonroot --from=deps-prod /app/node_modules ./node_modules
COPY --chown=nonroot:nonroot --from=build     /app/package*.json ./
COPY --chown=nonroot:nonroot --from=build     /app/server       ./server

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}

# Run both processes: Node server + WhisperLive Python server
CMD ["bash", "-c", "python3 server/WhisperLive/run_server.py & node server/index.js"]
