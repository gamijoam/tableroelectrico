#!/bin/sh
# Descarga el modelo de voz es_MX "claude" (alta calidad, Apache-2.0) para Piper TTS.
set -e
cd "$(dirname "$0")"
base=https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/claude/high
curl -fL -o es_MX-claude-high.onnx "$base/es_MX-claude-high.onnx"
curl -fL -o es_MX-claude-high.onnx.json "$base/es_MX-claude-high.onnx.json"
