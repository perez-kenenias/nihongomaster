#!/bin/bash
set -e

if [ ! -f "/models/ggml-large-v3.bin" ]; then
    echo "Downloading whisper large-v3 model..."
    curl -L "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin" -o /models/ggml-large-v3.bin
fi

python3 /app/server.py &
wait
