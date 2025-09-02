# ============================
# 1. Python Base
# ============================
FROM python:3.11-slim-bookworm AS pythonbase

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install only runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates ffmpeg portaudio19-dev supervisor netcat-openbsd \
 && apt-get clean && rm -rf /var/lib/apt/lists/*


# ============================
# 2. Python Dependencies
# ============================
FROM pythonbase AS python-deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3-dev \
 && rm -rf /var/lib/apt/lists/*

COPY server ./server

# ✅ Install Python deps (Torch + Whisper + requirements)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefer-binary \
        torch==2.5.1 -f https://download.pytorch.org/whl/torch_stable.html && \
    pip install --no-cache-dir --prefer-binary openai-whisper && \
    pip install --no-cache-dir --prefer-binary \
        -r server/requirement.txt \
        -r server/WhisperLive/requirements/client.txt \
        -r server/WhisperLive/requirements/server.txt


# ============================
# 3. Node Build (Frontend)
# ============================
FROM node:20.17.0-slim AS node-build
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install ONLY prod deps → skip devDependencies (saves memory & time)
RUN npm ci --omit=dev

# Copy rest of app and build
COPY . .
RUN npm run build


# ============================
# 4. Final Runtime
# ============================
FROM pythonbase AS runtime

# Copy Python deps
COPY --from=python-deps /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy built frontend (Next.js / Express output)
COPY --from=node-build /app /app

# Supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

WORKDIR /app

# Expose ports
EXPOSE 3000 4000

# Healthcheck (fail-safe)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health && curl -f http://localhost:4000/health || exit 1

# Start Supervisor (manages Whisper + Express)
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
