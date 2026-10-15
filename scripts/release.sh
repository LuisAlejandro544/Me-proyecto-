#!/usr/bin/env bash
# Laptop: sube versión patch en package.json + tauri.conf.json + Cargo.toml,
# verifica, empaqueta y deja el tag listo (no pushea solo).
# Uso: bash scripts/release.sh
set -euo pipefail
cd "$(dirname "$0")/.."
node -e "
const fs = require('fs');
const bump = (f, get, set) => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); const v = get(j).split('.'); v[2] = String(Number(v[2]) + 1); const nv = v.join('.'); set(j, nv); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); return nv; };
const v = bump('package.json', j => j.version, (j, nv) => j.version = nv);
bump('src-tauri/tauri.conf.json', j => j.version, (j, nv) => j.version = nv);
let cargo = fs.readFileSync('src-tauri/Cargo.toml', 'utf8').replace(/^version = \".*\"/m, 'version = \"' + v + '\"');
fs.writeFileSync('src-tauri/Cargo.toml', cargo);
console.log('Nueva versión: ' + v);
"
bash scripts/check.sh
bash scripts/package-web.sh
echo "✅ revisa con: git diff --stat && git tag v\$(node -p \"require('./package.json').version\")"
