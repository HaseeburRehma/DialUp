#!/usr/bin/env bash
set -euo pipefail  # safer: exit on error, undefined vars, pipe fails

# === CONFIG ===
PYTHON="python3.11"
VENV_DIR="server/WhisperLive/venv"
REQ_DIR="server/WhisperLive/requirements"
REQ_FILES=("server.txt" "client.txt")
EXTRA_REQ="server/requirement.txt"

echo "📦 Setting up virtual environment in $VENV_DIR ..."

# 1. Ensure python is installed
if ! command -v $PYTHON &> /dev/null; then
    echo "❌ $PYTHON not found. Please install it before continuing."
    exit 1
fi

# 2. Remove old venv if exists (force clean)
if [ -d "$VENV_DIR" ]; then
    echo "♻️ Removing existing venv..."
    rm -rf "$VENV_DIR"
fi

# 3. Create venv
echo "🔨 Creating new venv..."
$PYTHON -m venv "$VENV_DIR"

# 4. Activate venv
source "$VENV_DIR/bin/activate"

# 5. Upgrade pip + wheel
echo "⬆️ Upgrading pip & wheel..."
pip install --upgrade pip wheel setuptools

# 6. Install PyTorch CPU-only (lightweight build)
echo "💾 Installing PyTorch CPU-only..."
pip install torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 \
  --index-url https://download.pytorch.org/whl/cpu

# 7. Install Whisper
echo "🎙 Installing OpenAI Whisper..."
pip install openai-whisper

# 8. Install project requirements
for req in "${REQ_FILES[@]}"; do
    if [ -f "$REQ_DIR/$req" ]; then
        echo "📥 Installing $req ..."
        pip install -r "$REQ_DIR/$req"
    fi
done

if [ -f "$EXTRA_REQ" ]; then
    echo "📥 Installing extra requirements ($EXTRA_REQ) ..."
    pip install -r "$EXTRA_REQ"
fi

echo "✅ Virtual environment setup complete!"
echo "👉 To activate it, run: source $VENV_DIR/bin/activate"
