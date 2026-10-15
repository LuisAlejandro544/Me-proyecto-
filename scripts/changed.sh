#!/usr/bin/env bash
# Muestra los archivos que trae un commit.
# En merges (GitHub muestra "0 files"), lista lo que aportó CADA lado.
# Uso: bash scripts/changed.sh [<commit>]   (por defecto: HEAD)
set -euo pipefail
cd "$(dirname "$0")/.."
C="${1:-HEAD}"
if git rev-parse --verify -q "$C^2" >/dev/null; then
  P1="$(git rev-parse --short "$C^1")"; P2="$(git rev-parse --short "$C^2")"
  BASE="$(git merge-base "$C^1" "$C^2")"
  echo "Merge $C = $P1 + $P2"
  echo "--- lado 1 ($P1, nuestro):"; git diff --name-only "$BASE" "$C^1" | head -n 30
  echo "--- lado 2 ($P2, ellos):"; git diff --name-only "$BASE" "$C^2"
else
  git show --name-status --oneline "$C"
fi
