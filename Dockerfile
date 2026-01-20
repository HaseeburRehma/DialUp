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

# Install PyTorch CPU-only
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
RUN npm ci

COPY . .

# Build Next.js in standalone mode
RUN npm run build

# ============================
# 4. Final Runtime
# ============================
FROM pythonbase AS runtime

# Copy built Node.js + deps
COPY --from=node-build /usr/local /usr/local
ENV PATH="/usr/local/bin:/usr/local/lib/node_modules/npm/bin:$PATH"

# Copy Python deps
COPY --from=python-deps /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy application files from node-build
COPY --from=node-build /app/.next /app/.next
COPY --from=node-build /app/node_modules /app/node_modules
COPY --from=node-build /app/public /app/public
COPY --from=node-build /app/package.json /app/package.json

# Copy server files
COPY server /app/server
COPY next.config.ts /app/
COPY .env* /app/

# Copy configuration files
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY check_procs.sh /usr/local/bin/check_procs.sh
RUN chmod +x /usr/local/bin/check_procs.sh

WORKDIR /app

# Create necessary directories
RUN mkdir -p /tmp /var/log/supervisor && chmod 777 /tmp

# Expose ports
EXPOSE 3000 4001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health && curl -f http://localhost:4001/healthz || exit 1

# Start supervisor (runs both Whisper + Express)
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]