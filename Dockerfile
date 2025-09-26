# ============================
# 1. Python Base
# ============================
FROM python:3.11-slim-bookworm AS pythonbase

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates ffmpeg portaudio19-dev supervisor netcat-openbsd \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# ============================
# 2. Python Build Stage
# ============================
FROM pythonbase AS python-deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3-dev \
 && rm -rf /var/lib/apt/lists/*

COPY server ./server

# ✅ Install PyTorch CPU-only wheel (no CUDA, ~200MB instead of 3–8GB)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 \
        --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir --prefer-binary openai-whisper && \
    pip install --no-cache-dir --prefer-binary \
        -r server/requirement.txt \
        -r server/WhisperLive/requirements/client.txt \
        -r server/WhisperLive/requirements/server.txt

# ============================
# 3. Node Build Stage
# ============================
FROM node:20.17.0-slim AS node-build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install autoprefixer postcss && npm ci

COPY . .
RUN npm run build


# Expose ports (Railway ignores but good docs)
EXPOSE 3000 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health && curl -f http://localhost:4000/health || exit 1

# Start supervisor (runs Whisper + Express)
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]




# ============================
# 5. Final Runtime
# ============================
FROM pythonbase AS runtime

# Copy built Node.js + deps
COPY --from=node-build /usr/local /usr/local
ENV PATH="/usr/local/bin:/usr/local/lib/node_modules/npm/bin:$PATH"

# Copy Python deps
COPY --from=python-deps /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy app files
COPY --from=node-build /app /app

# Supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

WORKDIR /app

# Expose ports (Railway ignores but good docs)
EXPOSE 3000 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health && curl -f http://localhost:4000/health || exit 1

# Start supervisor (runs Whisper + Express)
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
