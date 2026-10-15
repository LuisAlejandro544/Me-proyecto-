#!/usr/bin/env bash
# Compila Manga Maker / My Novel por plataforma.
# Uso: bash scripts/build.sh [--apk] [--linux] [--windows] [--web] [--all]
# En CI lo ejecuta GitHub Actions; en local compila lo que soporte tu OS.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Falta $1 en PATH"; exit 1; }; }
need flutter

DO_APK=0; DO_LINUX=0; DO_WIN=0; DO_WEB=0
if [ "$#" -eq 0 ]; then set -- --all; fi
for a in "$@"; do
  case "$a" in
    --apk) DO_APK=1;;
    --linux) DO_LINUX=1;;
    --windows) DO_WIN=1;;
    --web) DO_WEB=1;;
    --all) DO_APK=1; DO_LINUX=1; DO_WIN=1; DO_WEB=1;;
    -h|--help) sed -n '2,5p' "$0"; exit 0;;
    *) echo "Flag desconocido: $a (usa --apk --linux --windows --web --all)"; exit 1;;
  esac
done

OS="$(uname -s)"
flutter pub get
flutter analyze
flutter test

if [ "$DO_APK" -eq 1 ]; then
  echo "== APK release por ABI (32 + 64 bits) =="
  flutter build apk --release --split-per-abi
  ls -lh build/app/outputs/flutter-apk/*.apk
fi
if [ "$DO_LINUX" -eq 1 ]; then
  if [ "$OS" = "Linux" ]; then
    echo "== Linux desktop =="
    flutter build linux --release
    echo "Binario en: build/linux/x64/release/bundle/"
  else
    echo "!! Linux solo se compila en Linux (saltado en $OS)"
  fi
fi
if [ "$DO_WIN" -eq 1 ]; then
  case "$OS" in
    MINGW*|MSYS*|CYGWIN*|Windows_NT)
      echo "== Windows desktop =="
      flutter build windows --release
      echo "Binario en: build/windows/x64/Runner/Release/";;
    *)
      echo "!! Windows solo se compila en Windows (saltado en $OS)";;
  esac
fi
if [ "$DO_WEB" -eq 1 ]; then
  echo "== Web release =="
  flutter build web --release
  echo "Sitio en: build/web/index.html"
fi
echo "OK: builds pedidos terminados."
