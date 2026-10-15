#!/usr/bin/env bash
# Laptop: build web + sincroniza nativo (Capacitor).
# Uso: bash scripts/build-all.sh
set -euo pipefail
cd "$(dirname "$0")/.."
bash scripts/check.sh
npx cap sync
echo "✅ dist/ sincronizado a proyectos nativos (android/ios si existen)"
