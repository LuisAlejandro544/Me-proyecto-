#!/usr/bin/env bash
# Laptop: verificación rápida (lo mismo que corre el CI web-check).
# Uso: bash scripts/check.sh
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
npm run check
echo "✅ build + svelte-check OK"
