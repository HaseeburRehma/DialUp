# syntax=docker/dockerfile:1

############################
# 1) Install dev dependencies
############################
FROM node:20-bookworm-slim AS deps-dev
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_LEGACY_PEER_DEPS=true

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
    ffmpeg make g++ pkg-config \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

# Install Python requirements for dev
COPY server/requirements.txt ./server/requirements.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements
RUN pip3 install --no-cache-dir \
    -r server/requirements.txt \
    -r server/WhisperLive/requirements/client.txt \
    -r server/WhisperLive/requirements/server.txt

############################
# 2) Build Next.js + server
############################
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip ffmpeg \
 && rm -rf /var/lib/apt/lists/*

COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .

RUN pip3 install --no-cache-dir \
    -r server/requirements.txt \
    -r server/WhisperLive/requirements/client.txt \
    -r server/WhisperLive/requirements/server.txt

ARG MONGODB_URI
ENV MONGODB_URI=$MONGODB_URI

RUN npm run build

############################
# 3) Production dependencies
############################
FROM node:20-bookworm-slim AS deps-prod
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip ffmpeg supervisor \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Install Python requirements for production
COPY server/requirements.txt ./server/requirements.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements
RUN pip3 install --no-cache-dir \
    -r server/requirements.txt \
    -r server/WhisperLive/requirements/client.txt \
    -r server/WhisperLive/requirements/server.txt

############################
# 4) Runtime
############################
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=${PORT:-3000} \
    WHISPER_PORT=${WHISPER_PORT:-9090}

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip ffmpeg supervisor \
 && rm -rf /var/lib/apt/lists/*

COPY --from=build     /app/.next        ./.next
COPY --from=build     /app/public       ./public
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build     /app/package*.json ./package*.json
COPY --from=build     /app/server       ./server
COPY --from=build     /app/WhisperLive  ./WhisperLive

# Supervisord config to run both Node.js and WhisperLive
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE ${PORT} ${WHISPER_PORT}

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
