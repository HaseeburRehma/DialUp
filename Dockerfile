# =====================================================
# 1️⃣ Base Runtime (Python + System Dependencies)
# =====================================================
FROM python:3.11-slim-bookworm AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    ENABLE_WATCHDOG=false \
    NODE_ENV=production

WORKDIR /app

# System deps (single atomic layer – important)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    ffmpeg \
    portaudio19-dev \
    supervisor \
    netcat-openbsd \
    procps \
    psmisc \
    bash \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# =====================================================
# 2️⃣ Python Dependencies (Whisper / Backend)
# =====================================================
FROM base AS python-deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
 && rm -rf /var/lib/apt/lists/*

COPY server ./server

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        torch==2.5.1 \
        torchvision==0.20.1 \
        torchaudio==2.5.1 \
        --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir \
        openai-whisper && \
    pip install --no-cache-dir \
        -r server/requirement.txt \
        -r server/WhisperLive/requirements/client.txt \
        -r server/WhisperLive/requirements/server.txt

# =====================================================
# 3️⃣ Node Build (Next.js + Express)
# =====================================================
FROM node:20.17.0-slim AS node-build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

ENV NODE_OPTIONS="--max-old-space-size=1024"

RUN npm run build

# =====================================================
# 4️⃣ Final Runtime Image (Stable)
# =====================================================
FROM base AS runtime

# Copy Node runtime + npm
COPY --from=node-build /usr/local /usr/local
ENV PATH="/usr/local/bin:/usr/local/lib/node_modules/npm/bin:$PATH"

# Copy Python deps
COPY --from=python-deps /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy built app
COPY --from=node-build /app /app

# Supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

WORKDIR /app

# Exposed ports
EXPOSE 3000 4000 4001

# Healthcheck (non-blocking, stable)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fs http://localhost:3000/health \
   && curl -fs http://localhost:4001/healthz || exit 1

# Start services
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
