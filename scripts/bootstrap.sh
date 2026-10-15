#!/usr/bin/env bash
# Laptop: prepara el entorno por primera vez (o lo repara).
# Uso: bash scripts/bootstrap.sh
set -euo pipefail
cd "$(dirname "$0")/.."

command -v node >/dev/null || { echo "❌ instala Node 20+ primero"; exit 1; }
node -e "process.exit(Number(process.versions.node.split('.')[0]) < 20 ? 1 : 0)" \
  || { echo "❌ Node 20+ requerido: $(node --version)"; exit 1; }

echo "📦 npm install..."
npm install --no-audit --no-fund

echo "🔍 checks opcionales:"
command -v cargo >/dev/null && echo "  rust: $(cargo --version)" || echo "  rust: no instalado (solo necesario para Tauri)"
command -v java >/dev/null && echo "  java: ok (Capacitor/Android)" || echo "  java: no instalado (solo necesario para APK local)"

echo "✅ listo. Siguientes: npm run dev | npm run tauri:dev"
