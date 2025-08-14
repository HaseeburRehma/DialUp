# ============================
# 1. Python Base for Backend
# ============================
FROM python:3.11-slim-bookworm AS pythonbase

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Install runtime dependencies (no compiler here to keep it small)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg portaudio19-dev supervisor curl ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app


# ============================
# 2. Install Python Dependencies
# ============================
FROM pythonbase AS python-deps

# Install build tools temporarily for compiling PyAudio
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY server/requirement.txt ./server/requirement.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements

RUN pip install --no-cache-dir --upgrade pip && \
    grep -rl "openai-whisper" server || true | xargs -r sed -i '/openai-whisper/d' && \
    pip install --no-cache-dir --prefer-binary torch==2.7.1 && \
    pip install --no-cache-dir --prefer-binary \
        -r server/requirement.txt \
        -r server/WhisperLive/requirements/client.txt \
        -r server/WhisperLive/requirements/server.txt


# ============================
# 3. Node.js Build for Frontend
# ============================
FROM node:18-slim AS node-build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build


# ============================
# 4. Final Runtime Image
# ============================
FROM pythonbase AS runtime

# Copy Python dependencies from python-deps stage
COPY --from=python-deps /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy built Next.js app & node_modules
COPY --from=node-build /app/.next ./.next
COPY --from=node-build /app/public ./public
COPY --from=node-build /app/node_modules ./node_modules
COPY --from=node-build /app/package.json ./package.json

# Copy server source and supervisor config
COPY server ./server
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 9090 3000
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
