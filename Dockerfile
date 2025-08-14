# ============================
# Base image with Python & system deps
# ============================
FROM python:3.9-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-dev python3-pip python3-venv \
    build-essential \
    ffmpeg wget git \
    portaudio19-dev \
    && rm -rf /var/lib/apt/lists/*

# ============================
# Stage for installing deps
# ============================
FROM base AS deps-prod

WORKDIR /app

# Copy requirements files
COPY server/requirement.txt ./server/requirement.txt
COPY server/WhisperLive/requirements ./server/WhisperLive/requirements

# Install Python dependencies
RUN pip install --upgrade pip && \
    # Remove openai-whisper from all requirements to avoid version conflicts
    sed -i '/openai-whisper/d' server/requirement.txt && \
    sed -i '/openai-whisper/d' server/WhisperLive/requirements/server.txt && \
    sed -i '/openai-whisper/d' server/WhisperLive/requirements/client.txt && \
    pip install --no-cache-dir \
        -r server/requirement.txt \
        -r server/WhisperLive/requirements/client.txt \
        -r server/WhisperLive/requirements/server.txt

# ============================
# Copy application code
# ============================
FROM deps-prod AS app

WORKDIR /app

# Copy the entire application
COPY . .

# ============================
# Runtime command
# Replace with your actual process manager if needed
# ============================
# Example: running both backend server and whisper live server
CMD [ "sh", "-c", "python3 server/main.py & python3 server/WhisperLive/server.py & wait" ]
