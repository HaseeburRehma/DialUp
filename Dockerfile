# Optimized Multi-stage Dockerfile
FROM node:20.17.0-slim AS node-build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ============================
# Python Runtime Stage
# ============================
FROM python:3.11-slim-bookworm AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NODE_VERSION=20.17.0 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install system dependencies in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates ffmpeg portaudio19-dev supervisor netcat-openbsd \
    build-essential python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (smaller approach than copying from node image)
RUN curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz | tar -xJ -C /usr/local --strip-components=1

# Copy Python requirements first (for better caching)
COPY server/requirement.txt ./server/
COPY server/WhisperLive/requirements/ ./server/WhisperLive/requirements/

# Install Python dependencies with memory optimization
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefer-binary torch==2.5.1 && \
    pip install --no-cache-dir --prefer-binary openai-whisper && \
    pip install --no-cache-dir --prefer-binary \
        -r server/requirement.txt \
        -r server/WhisperLive/requirements/client.txt \
        -r server/WhisperLive/requirements/server.txt

# Copy remaining server files
COPY server ./server

# Copy built Next.js app from node-build stage
COPY --from=node-build /app/.next ./.next
COPY --from=node-build /app/public ./public
COPY --from=node-build /app/package*.json ./

# Install only production node dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy configuration files with conditional copying
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy config files if they exist (handle both .js and .ts extensions)
COPY --from=node-build /app/next.config.* ./
COPY --from=node-build /app/tailwind.config.* ./
COPY --from=node-build /app/postcss.config.* ./

# Clean up build dependencies to reduce image size
RUN apt-get remove -y build-essential python3-dev && \
    apt-get autoremove -y && \
    apt-get clean

EXPOSE 3000 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]