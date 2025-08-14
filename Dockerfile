# syntax=docker/dockerfile:1

############################
# 1) Install dev dependencies
############################
FROM node:20-bookworm-slim AS deps-dev
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_LEGACY_PEER_DEPS=true

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv make g++ pkg-config ffmpeg wget git \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

# Install Python dependencies for WhisperLive (dev)
COPY server/requirement.txt ./server/requirement.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements
# Remove conflicting whisper version if present in requirement.txt
RUN sed -i '/openai-whisper/d' server/requirement.txt
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
# 3) Production dependencies
############################
FROM node:20-bookworm-slim AS deps-prod
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv ffmpeg wget git supervisor \
 && rm -rf /var/lib/apt/lists/*

# Create virtual environment for Python packages
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY server/requirement.txt ./server/requirement.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements
RUN sed -i '/openai-whisper/d' server/requirement.txt
RUN pip install --no-cache-dir \
    -r server/requirement.txt \
    -r server/WhisperLive/requirements/client.txt \
    -r server/WhisperLive/requirements/server.txt


############################
# 4) Runtime with supervisord
############################
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=${PORT:-3000} \
    WHISPER_PORT=${WHISPER_PORT:-9090}

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv ffmpeg supervisor \
 && rm -rf /var/lib/apt/lists/*

COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=deps-prod /opt/venv /opt/venv

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
COPY --from=build /app/server ./server

# Add supervisord config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE ${PORT} ${WHISPER_PORT}

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
