# ============================
# 1. Base builder image (Python)
# ============================
FROM python:3.9-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-dev python3-pip python3-venv \
    build-essential \
    ffmpeg wget git \
    portaudio19-dev \
    supervisor curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ============================
# 2. Install Python deps
# ============================
FROM base AS deps-builder

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
# 3. Final runtime image
# ============================
FROM python:3.9-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Install runtime deps + Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg portaudio19-dev supervisor curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python packages from builder
COPY --from=deps-builder /usr/local/lib/python3.9 /usr/local/lib/python3.9
COPY --from=deps-builder /usr/local/bin /usr/local/bin

# Copy full app source
COPY . .

# Install Node dependencies & build both Next.js and Express
RUN npm install && npm run build

# Create supervisor directory & config
RUN mkdir -p /etc/supervisor/conf.d
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 9090 3000

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
