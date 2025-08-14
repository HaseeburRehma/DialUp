# ============================
# 1. Base builder image
# ============================
FROM python:3.9-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1

# Install system build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-dev python3-pip python3-venv \
    build-essential \
    ffmpeg wget git \
    portaudio19-dev \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ============================
# 2. Install dependencies
# ============================
FROM base AS deps-builder

COPY server/requirement.txt ./server/requirement.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements

RUN pip install --upgrade pip && \
    # Remove openai-whisper from all requirements if present
    grep -rl "openai-whisper" server || true | xargs -r sed -i '/openai-whisper/d' && \
    # Install torch first to prevent Triton conflicts
    pip install torch==2.7.1 --prefer-binary && \
    pip install --prefer-binary \
        -r server/requirement.txt \
        -r server/WhisperLive/requirements/client.txt \
        -r server/WhisperLive/requirements/server.txt

# ============================
# 3. Final minimal runtime image
# ============================
FROM python:3.9-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Install only runtime deps (no compilers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg portaudio19-dev supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=deps-builder /usr/local/lib/python3.9 /usr/local/lib/python3.9
COPY --from=deps-builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Supervisord config
RUN mkdir -p /etc/supervisor/conf.d
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Run supervisor
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]