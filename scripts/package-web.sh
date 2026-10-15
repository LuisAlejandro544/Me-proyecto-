#!/usr/bin/env bash
# Laptop o CI: empaqueta la build web en un zip descargable.
# Uso: bash scripts/package-web.sh [dir-salida]
# Sale: <dir-salida>/my-novel-studio-web-<version>.zip (dist/ + html legacy)
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-release}"
VERSION="$(node -p "require('./package.json').version")"
mkdir -p "$OUT" dist
npm run build
ZIP="$OUT/my-novel-studio-web-$VERSION.zip"
rm -f "$ZIP"
zip -qr "$ZIP" dist my_novel_visual_novel_node_studio.html README.md
echo "✅ $ZIP"
