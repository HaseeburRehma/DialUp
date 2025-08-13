# syntax=docker/dockerfile:1

############################
# 1) Install dev dependencies (Node + Python)
############################
FROM node:20-bookworm-slim AS deps-dev
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_LEGACY_PEER_DEPS=true

# Install build tools for node-gyp + Python + pip + ffmpeg + git
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv make g++ pkg-config ffmpeg wget git \
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
# 3) Install production deps (Node + Python)
############################
FROM node:20-bookworm-slim AS deps-prod
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install prod dependencies for Node
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Install Python + WhisperLive for prod
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv ffmpeg wget git bash \
 && rm -rf /var/lib/apt/lists/*

# Create virtual environment for Python packages
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY server/requirement.txt ./server/requirement.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements

RUN pip install --no-cache-dir \
    -r server/requirement.txt \
    -r server/WhisperLive/requirements/client.txt \
    -r server/WhisperLive/requirements/server.txt


############################
# 4) Final runtime container
############################
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=${PORT:-3000}

# Install Python runtime + ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv ffmpeg bash \
 && rm -rf /var/lib/apt/lists/*

# Copy production Node modules and Python venv
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=deps-prod /opt/venv /opt/venv

# Copy built app
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
COPY --from=build /app/server ./server

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}

# Run both processes
CMD bash -c "python3 server/WhisperLive/run_server.py & node server/index.js"
