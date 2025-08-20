# Production Multi-stage Dockerfile
FROM node:20.17.0-slim AS node-build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Ensure public directory exists for Next.js
RUN mkdir -p public

# ============================
# Python Runtime Stage
# ============================
FROM python:3.11-slim-bookworm AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    NODE_VERSION=20.17.0

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates ffmpeg portaudio19-dev supervisor netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz \
    | tar -xJ -C /usr/local --strip-components=1

# Copy server files
COPY server ./server

# Install Python dependencies in correct order to avoid conflicts
RUN pip install --no-cache-dir --upgrade pip

# Install PyTorch CPU version first (resolves version conflict with your torch==2.7.1)
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
    torch==2.5.1+cpu torchaudio==2.5.1+cpu

# Install openai-whisper (depends on torch)
RUN pip install --no-cache-dir openai-whisper

# Install your specific requirements (excluding torch to avoid conflict)
RUN pip install --no-cache-dir \
    openai==1.9.0 \
    numpy \
    scipy \
    deepl \
    pydub \
    cohere \
    ffmpeg-python \
    "typing-extensions>=4.10.0,<5"

# Skip TensorFlow-probability for now to save memory (uncomment if needed)
# RUN pip install --no-cache-dir tensorflow-probability==0.23.0

# Install WhisperLive requirements if they exist
RUN if [ -f "server/WhisperLive/requirements/client.txt" ]; then \
        pip install --no-cache-dir -r server/WhisperLive/requirements/client.txt; \
    fi
RUN if [ -f "server/WhisperLive/requirements/server.txt" ]; then \
        pip install --no-cache-dir -r server/WhisperLive/requirements/server.txt; \
    fi

# Copy built Next.js application
COPY --from=node-build /app/.next ./.next
COPY --from=node-build /app/package*.json ./

# Create public directory and copy if it exists
RUN mkdir -p ./public
COPY --from=node-build /app/public ./public/ 2>/dev/null || echo "No public directory in source"

# Install Node.js production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create basic next.config.js if missing
RUN if [ ! -f "next.config.js" ] && [ ! -f "next.config.mjs" ] && [ ! -f "next.config.ts" ]; then \
        echo 'module.exports = { output: "standalone" }' > next.config.js; \
    fi

# Create basic health endpoint if missing
RUN mkdir -p pages/api && \
    if [ ! -f "pages/api/health.js" ] && [ ! -d "app/api/health" ]; then \
        echo 'export default function handler(req, res) { res.status(200).json({ status: "OK", timestamp: new Date().toISOString() }); }' > pages/api/health.js; \
    fi

EXPOSE 3000 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || curl -f http://localhost:3000/api/health || exit 1

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]