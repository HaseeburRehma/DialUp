# ============================
# 1. Python Base (AWS ECR)
# ============================
FROM public.ecr.aws/docker/library/python:3.11-slim-bookworm AS pythonbase

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    CUDA_VISIBLE_DEVICES=""

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates ffmpeg portaudio19-dev supervisor netcat-openbsd \
 && apt-get clean && rm -rf /var/lib/apt/lists/*


# ============================
# 2. Python Dependencies
# ============================
FROM pythonbase AS python-deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3-dev \
 && rm -rf /var/lib/apt/lists/*

COPY server ./server

RUN pip install --upgrade pip && \
    pip install \
      torch==2.5.1+cpu \
      torchvision==0.20.1+cpu \
      torchaudio==2.5.1+cpu \
      --index-url https://download.pytorch.org/whl/cpu && \
    pip install --prefer-binary \
      openai-whisper \
      -r server/requirement.txt \
      -r server/WhisperLive/requirements/client.txt \
      -r server/WhisperLive/requirements/server.txt


# ============================
# 3. Node Build (AWS ECR)
# ============================
FROM public.ecr.aws/docker/library/node:20-slim AS node-build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install autoprefixer postcss && npm ci

COPY . .
RUN npm run build


# ============================
# 4. Final Runtime Image
# ============================
FROM pythonbase AS runtime

# Node runtime
COPY --from=node-build /usr/local /usr/local
ENV PATH="/usr/local/bin:/usr/local/lib/node_modules/npm/bin:$PATH"

# Python deps
COPY --from=python-deps /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-deps /usr/local/bin /usr/local/bin

# App
COPY --from=node-build /app /app
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

WORKDIR /app

EXPOSE 3000 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health && \
      curl -f http://localhost:4001/healthz || exit 1

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
