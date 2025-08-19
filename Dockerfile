# ============ Base ============ 
FROM python:3.11-slim as pythonbase
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# system deps (needed for whisper/torch & node)
RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg \
    git \
    curl \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# ============ Python Deps (cached layer) ============
FROM pythonbase as python-deps
WORKDIR /app
COPY server/requirement.txt ./server/
COPY server/WhisperLive/requirements/ ./server/WhisperLive/requirements/
RUN pip install --no-cache-dir -r server/requirement.txt -r server/WhisperLive/requirements/requirements.txt
# heavy deps pinned here → cached unless reqs change

# ============ Node Builder ============ 
FROM node:20-slim as node-build
WORKDIR /app

# copy package manifests first for caching
COPY package.json package-lock.json* ./

# install deps with npm
RUN npm ci --omit=dev

# copy rest of app and build
COPY . .
RUN npm run build

# ============ Runtime ============ 
FROM pythonbase as runtime
WORKDIR /app

# copy Python deps from python-deps
COPY --from=python-deps /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-deps /usr/local/bin /usr/local/bin

# copy built Node app from node-build
COPY --from=node-build /app/.next ./.next
COPY --from=node-build /app/public ./public
COPY --from=node-build /app/node_modules ./node_modules
COPY --from=node-build /app/package.json ./package.json

# copy server code
COPY server ./server

# supervisor config (optional, if you want parallel processes)
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3000 4000

# If you like Supervisor for logging
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

# OR, for faster startup without Supervisor, uncomment this instead:
# CMD ["sh", "-c", "python3 server/WhisperLive/run_server.py --port 4000 & node server/index.js"]
