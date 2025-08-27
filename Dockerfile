# ============================
# 1. Python Base (slim runtime)
# ============================
FROM python:3.11-slim-bookworm AS pythonbase

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Base runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates ffmpeg portaudio19-dev supervisor netcat-openbsd \
    asterisk asterisk-dev \
    nginx certbot \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ============================
# 2. Python Build Stage
# ============================
FROM pythonbase AS python-deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY server ./server

# Install Python deps (Torch first, then app deps)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefer-binary torch==2.5.1 && \
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

# ============================
# 4. Final Runtime Image
# ============================
FROM pythonbase AS runtime

# ✅ Copy built Node.js + deps
COPY --from=node-build /usr/local /usr/local
ENV PATH="/usr/local/bin:/usr/local/lib/node_modules/npm/bin:$PATH"

# ✅ Copy Python deps
COPY --from=python-deps /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-deps /usr/local/bin /usr/local/bin

# ✅ Copy app files
COPY --from=node-build /app /app

# Supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Generate self-signed certs (for dev/prod fallback)
RUN mkdir -p /etc/asterisk/keys && \
    openssl req -x509 -nodes -newkey rsa:2048 \
      -keyout /etc/asterisk/keys/privkey.pem \
      -out /etc/asterisk/keys/fullchain.pem \
      -days 365 \
      -subj "/CN=sip.voiceai.xyz" && \
    mkdir -p /etc/letsencrypt/live/sip.voiceai.xyz && \
    cp /etc/asterisk/keys/fullchain.pem /etc/letsencrypt/live/sip.voiceai.xyz/fullchain.pem && \
    cp /etc/asterisk/keys/privkey.pem /etc/letsencrypt/live/sip.voiceai.xyz/privkey.pem

# Asterisk config
COPY etc/asterisk/config /etc/asterisk

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf


# Certificates (mount real certs in prod, or use self-signed for dev)
# VOLUME ["/etc/letsencrypt"]

WORKDIR /app

# Ports (docs only; Railway ignores but Compose uses them)
EXPOSE 3000 4000 8089 5060/udp 10000-20000/udp

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health && curl -f http://localhost:4000/health || exit 1

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
