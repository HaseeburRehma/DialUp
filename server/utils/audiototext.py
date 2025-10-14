#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Local Whisper transcription/translation (no API key needed).
Prints only the transcript text to stdout.
"""

import sys
# On Python ≥3.7 you can reconfigure the standard output to UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import argparse
import os
import subprocess
import torch
import whisper


def check_ffmpeg(cmd="ffmpeg"):
    try:
        subprocess.run([cmd, "-version"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        sys.exit("❌ ffmpeg not found. Install it or set FFMPEG_PATH environment variable.")


def main():
    p = argparse.ArgumentParser(
        description="Local Whisper transcription/translation (no API key needed)."
    )
    p.add_argument("audio_file", nargs='+', help="Audio file(s) to process")
    p.add_argument("--task", choices=["transcribe","translate"], default="transcribe")
    p.add_argument("--model", choices=["tiny","base","small","medium","large-v1","large-v2"], default="tiny")
    p.add_argument("--language", default="Auto-Detect")
    p.add_argument("--coherence_preference", action="store_true")
    p.add_argument("--prompt", default=None)
    args = p.parse_args()

    check_ffmpeg(os.environ.get("FFMPEG_PATH","ffmpeg"))

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = whisper.load_model(args.model, device=device)

    opts = {
        "task": args.task,
        "verbose": False,
        "fp16": (device == "cuda"),
        "condition_on_previous_text": args.coherence_preference,
        "initial_prompt": args.prompt,
    }

    for path in args.audio_file:
        if not os.path.isfile(path):
            print(f"⚠️  File not found: {path}", file=sys.stderr)
            continue

        result = whisper.transcribe(model, path, **opts)
        full = "\n".join(seg["text"].strip() for seg in result.get("segments", []))
        print(full)


if __name__ == "__main__":
    main()