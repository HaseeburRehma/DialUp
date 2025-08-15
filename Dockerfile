# ============================
# 1. Python Base (slim runtime)
# ============================
FROM python:3.11-slim-bookworm AS pythonbase

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Base runtime deps (no compilers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates ffmpeg portaudio19-dev supervisor netcat-openbsd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ============================
# 2. Python Build Stage
# ============================
FROM pythonbase AS python-deps

# Build tools for Python deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY server ./server

# Install Python deps (Torch first, then app deps)
RUN pip install --no-cache-dir --upgrade pip && \
    grep -rl "openai-whisper" server || true | xargs -r sed -i '/openai-whisper/d' && \
    pip install --no-cache-dir --prefer-binary torch==2.5.1 && \
    pip install --no-cache-dir --prefer-binary \
        -r server/requirement.txt \
        -r server/WhisperLive/requirements/client.txt \
        -r server/WhisperLive/requirements/server.txt

# ============================
# 3. Node Build Stage
# ============================
FROM node:20.17.0-slim AS node-build
WORKDIR /app

# Install all deps (including dev) for build
COPY package.json package-lock.json* ./
# Ensure PostCSS + Autoprefixer are installed in prod
RUN npm install autoprefixer postcss && npm ci

COPY . .
RUN npm run build

# ============================
# 4. Final Runtime Image
# ============================
FROM pythonbase AS runtime

# ✅ Copy built Node.js + deps
COPY --from=node-build /usr/local /usr/local
ENV PATH="/usr/local/bin:/usr/local/lib/node_modules/npm/bin:$PATH"

# ✅ Copy Python deps
COPY --from=python-deps /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-deps /usr/local/bin /usr/local/bin

# ✅ Copy package files first
COPY --from=node-build /app/package.json /app/package-lock.json* /app/
WORKDIR /app

# ✅ Install ONLY production dependencies to ensure all runtime deps are present
RUN npm ci --only=production --prefer-offline

# ✅ Copy the rest of the built app
COPY --from=node-build /app /app

# Supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Ports (docs only; Railway ignores)
EXPOSE 3000 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health && curl -f http://localhost:4000/health || exit 1

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]