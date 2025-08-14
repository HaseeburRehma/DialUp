# ============================
# 1. Python Base for Backend
# ============================
FROM python:3.11-slim-bookworm AS pythonbase

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Install only required system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg portaudio19-dev supervisor curl ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app


# ============================
# 2. Install Python Dependencies
# ============================
FROM pythonbase AS python-deps

COPY server/requirement.txt ./server/requirement.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements

RUN pip install --upgrade pip && \
    grep -rl "openai-whisper" server || true | xargs -r sed -i '/openai-whisper/d' && \
    pip install torch==2.7.1 --prefer-binary && \
    pip install --prefer-binary \
        -r server/requirement.txt \
        -r server/WhisperLive/requirements/client.txt \
        -r server/WhisperLive/requirements/server.txt


# ============================
# 3. Node.js Build for Frontend & Express
# ============================
FROM node:18-slim AS node-build

WORKDIR /app

# Copy package files first for caching
COPY package.json package-lock.json* ./

# Install only production deps for faster build
RUN npm ci

# Copy full source
COPY . .

# Build Next.js frontend & backend
RUN npm run build


# ============================
# 4. Final Runtime Image
# ============================
FROM pythonbase AS runtime

# Copy installed Python deps from python-deps stage
COPY --from=python-deps /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy built Node.js app from node-build stage
COPY --from=node-build /app/.next ./.next
COPY --from=node-build /app/public ./public
COPY --from=node-build /app/node_modules ./node_modules
COPY --from=node-build /app/package.json ./package.json
COPY --from=node-build /app/dist ./dist

# Copy full app source for any runtime scripts
COPY . .

# Supervisor config
RUN mkdir -p /etc/supervisor/conf.d
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 9090 3000

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
