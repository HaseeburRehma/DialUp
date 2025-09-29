#!/usr/bin/env bash
set -e  # exit on error

# === CONFIG ===
PYTHON="python3.11"
VENV_DIR="server/WhisperLive/venv"
REQ_DIR="server/WhisperLive/requirements"
REQ_FILES=("server.txt" "client.txt")
EXTRA_REQ="server/requirement.txt"

echo "📦 Setting up virtual environment in $VENV_DIR ..."

# 1. Ensure python is installed
if ! command -v $PYTHON &> /dev/null; then
    echo "❌ $PYTHON not found. Install it before continuing."
    exit 1
fi

# 2. Create venv if not exists
if [ ! -d "$VENV_DIR" ]; then
    echo "🔨 Creating new venv..."
    $PYTHON -m venv "$VENV_DIR"
else
    echo "✅ ve
