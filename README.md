# My Novel — Visual Novel Node Studio (Web + TS + Svelte → Tauri + Capacitor)

Migración del monolito `my_novel_visual_novel_node_studio.html` (2111 líneas) a stack moderno sin perder funciones.

## Origen
- `my_novel_visual_novel_node_studio.html` → se conserva como referencia legacy.
- Portado a:
  - `src/app.css` ← `<style>` original + Tailwind
  - `src/App.svelte` ← markup del `<body>` (ids intactos)
  - `src/lib/studio.ts` ← `<script>` original verbatim, envuelto en `initStudio()` (`// @ts-nocheck` para paridad 100%)
  - `src/lib/types.ts` ← tipos `VNNode`, `VNWire`, `VNState`
  - `src/lib/platform.ts` ← bridge nativo Web/Tauri/Capacitor

## Web (Vite + Svelte + TS)
```bash
npm install      # regenera package-lock.json (ignorado en git)
npm run dev      # http://localhost:1420
npm run build    # → dist/
npm run preview
npm run check    # svelte-check, 0 errores
```

## Desktop — Tauri v2 → .exe real
El botón legacy “Win (.exe)” antes solo bajaba un `.bat`. Ahora el binario real sale de Tauri:
```bash
npm run tauri:dev    # dev con WebView
npm run tauri:build  # → src-tauri/target/release/bundle/ (.exe, .AppImage, .dmg)
```
Config: `src-tauri/tauri.conf.json` (`frontendDist: ../dist`), `src-tauri/src/main.rs` + `plugin-fs/dialog`.
Iconos: `npx tauri icon ./icon.svg` regenera `src-tauri/icons/` (los sets Android/iOS/Store están ignorados en git).

## Mobile — Capacitor 7 → Android/iOS
Mismo `dist/` compartido:
```bash
npm run build
npx cap add android   # una vez
npx cap add ios       # una vez (en mac)
npx cap sync          # copia dist/ a nativo
npx cap open android  # abre Android Studio
```
Export `.html` en móvil usa `@capacitor/filesystem` + `@capacitor/share` (`src/lib/platform.ts: saveHtmlExport`).

## Notas de port
- `App.svelte onMount(initStudio)` reemplaza `DOMContentLoaded`. `initStudio()` es idempotente (guard `__studioInited`).
- El wiring de pan/zoom del canvas vive en `wireCanvasPanZoom()` (debe correr con el DOM montado, no en el import).
- Queda pendiente refactorizar `studio.ts` (incluye `CHARACTER_ASSETS` base64) a stores Svelte por componente (`TopBar`, `Canvas`, `NodeCard`, `PlaytestModal`, etc.). La base ya compila y permite hacerlo incremental.
