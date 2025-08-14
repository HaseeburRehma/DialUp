# ============================
# 1. Python Base for Backend
# ============================
FROM python:3.11-slim-bookworm AS pythonbase

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PATH="/usr/local/bin:$PATH"

# Install Python runtime deps (no compilers here for small size)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates ffmpeg portaudio19-dev supervisor \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ============================
# 2. Install Python Dependencies
# ============================
FROM pythonbase AS python-deps

# Install build tools just for pip installs
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY server/requirement.txt ./server/requirement.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements

RUN pip install --no-cache-dir --upgrade pip && \
    grep -rl "openai-whisper" server || true | xargs -r sed -i '/openai-whisper/d' && \
    pip install --no-cache-dir --prefer-binary torch==2.7.1 && \
    pip install --no-cache-dir --prefer-binary \
        -r server/requirement.txt \
        -r server/WhisperLive/requirements/client.txt \
        -r server/WhisperLive/requirements/server.txt

# ============================
# 3. Node.js Build for Frontend
# ============================
FROM node:20.17.0-slim AS node-build

WORKDIR /app

# Install dependencies using npm ci for reproducibility
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ============================
# 4. Final Runtime Image
# ============================
FROM pythonbase AS runtime

# Install Node.js 20.x in final image (for Next.js + Express)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install -g npm@latest \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies
COPY --from=python-deps /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy built frontend & node_modules
COPY --from=node-build /app/.next ./.next
COPY --from=node-build /app/public ./public
COPY --from=node-build /app/node_modules ./node_modules
COPY --from=node-build /app/package.json ./package.json

# Copy server files
COPY server ./server

# Copy supervisord config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Ports for backend and frontend
EXPOSE 9090 3000

# Start all processes
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
