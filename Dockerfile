# ========================
# Stage 1: Dependencies (dev)
# ========================
FROM node:20-bullseye AS deps-dev

WORKDIR /app

# Install base dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv ffmpeg wget supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js deps
COPY package*.json ./
RUN npm ci

# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements
COPY server/requirement.txt ./server/requirement.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements

# Remove openai-whisper to speed up build
RUN sed -i '/openai-whisper/d' server/requirement.txt

# Install Python deps inside venv
RUN pip install --upgrade pip && \
    pip install --no-cache-dir \
        -r server/requirement.txt \
        -r server/WhisperLive/requirements/client.txt \
        -r server/WhisperLive/requirements/server.txt

# ========================
# Stage 2: Dependencies (prod)
# ========================
FROM node:20-bullseye AS deps-prod

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv ffmpeg wget supervisor \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

# Python venv
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY server/requirement.txt ./server/requirement.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements

RUN sed -i '/openai-whisper/d' server/requirement.txt

RUN pip install --upgrade pip && \
    pip install --no-cache-dir \
        -r server/requirement.txt \
        -r server/WhisperLive/requirements/client.txt \
        -r server/WhisperLive/requirements/server.txt

# ========================
# Stage 3: Build frontend
# ========================
FROM deps-prod AS build

COPY . .
RUN npm run build

# ========================
# Stage 4: Final image
# ========================
FROM node:20-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv ffmpeg wget supervisor \
    && rm -rf /var/lib/apt/lists/*

# Copy built files
COPY --from=build /app ./

# Python venv
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python deps
RUN pip install --upgrade pip && \
    pip install --no-cache-dir \
        -r server/requirement.txt \
        -r server/WhisperLive/requirements/client.txt \
        -r server/WhisperLive/requirements/server.txt

# Add supervisord config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose ports (adjust if needed)
EXPOSE 3000 8000

# Start both services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
