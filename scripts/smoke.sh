#!/usr/bin/env bash
# Smoke automatizado: web + carga headless (si hay Chromium).
# Uso: bash scripts/smoke.sh
set -euo pipefail
cd "$(dirname "$0")/.."
FAIL=0

echo "== 1/2 web =="
npm run build >/dev/null 2>&1 && echo "build OK" || { echo "❌ build"; FAIL=1; }
npm run check >/dev/null 2>&1 && echo "check OK" || { echo "❌ check"; FAIL=1; }

echo "== 2/2 carga headless =="
CHROME="$(ls ~/.cache/ms-playwright/*/chrome-linux*/chrome 2>/dev/null | head -n 1)"
if [ -z "$CHROME" ] || ! command -v npm >/dev/null; then
  echo "⊘ sin Chromium, se omite"
else
  (npm run dev &>/tmp/opencode/smoke-vite.log & echo $! > /tmp/opencode/smoke-vite.pid)
  sleep 9
  "$CHROME" --headless --no-sandbox --disable-gpu --enable-logging=stderr \
    --virtual-time-budget=8000 --dump-dom http://localhost:1420/ \
    2>/tmp/opencode/smoke-console.log > /tmp/opencode/smoke-dom.html
  OUT="$(grep -o 'class="vn-node[ "]' /tmp/opencode/smoke-dom.html | wc -l)"
  ERRS="$(grep -ci uncaught /tmp/opencode/smoke-console.log || true)"
  kill "$(cat /tmp/opencode/smoke-vite.pid)" 2>/dev/null || true
  for p in $(pgrep -f "[b]in/vite" 2>/dev/null); do kill "$p" 2>/dev/null || true; done
  echo "nodos=$OUT errores_consola=$ERRS"
  [ "$OUT" = "4" ] && [ "$ERRS" = "0" ] && echo "headless OK" || { echo "❌ headless"; FAIL=1; }
fi

[ "$FAIL" = "0" ] && echo "✅ SMOKE OK" || { echo "❌ SMOKE FALLÓ"; exit 1; }
