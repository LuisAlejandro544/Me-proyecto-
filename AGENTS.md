# Me-proyecto- — Visual Novel Node Studio

Stack: Web + TypeScript + Svelte (Vite 6) → Tauri v2 (desktop) + Capacitor 7 (mobile).
Idioma del repo: español en respuestas al usuario.

## Comandos (CI usa los mismos)
- `npm install` → `npm run dev` (http://localhost:1420)
- `npm run build` → `dist/` | `npm run preview`
- `npm run check` → svelte-check, debe dar 0 errores
- `npm run tauri:dev` / `npm run tauri:build` (requiere Rust + WebKit/GTK en Linux)
- `npx cap sync` tras `npm run build` (móvil)

## Estructura
- `src/App.svelte` — markup portado del HTML legacy (ids intactos, NO renombrar ids)
- `src/lib/studio.ts` — lógica legacy (`// @ts-nocheck`); expone `initStudio()` / `getStudioState()`
- `src/lib/types.ts` — tipos `VNNode`, `VNWire`, `VNState` (usar en código nuevo)
- `src/lib/platform.ts` — export nativo (Tauri `dialog`/`fs`, Capacitor `Filesystem`/`Share`)
- `my_novel_visual_novel_node_studio.html` — referencia legacy, no borrar
- `icon.svg` — fuente de iconos (`npx tauri icon ./icon.svg` los regenera)

## Reglas
- `initStudio()` es idempotente y debe correr con el DOM montado (`onMount`); jamás mover wiring de canvas al top-level del módulo (rompe el import: `canvasViewport` es null).
- Verificar siempre con `npm run build` + `npm run check` antes de dar por hecho un cambio.
- NO commitear: `node_modules/`, `dist/`, `src-tauri/target/`, `src-tauri/gen/`, `package-lock.json`, `src-tauri/Cargo.lock`, sets de iconos Android/iOS/Store (ver `.gitignore`).
- Commits cortos en español. PRs contra `main` con descripción breve + cómo se verificó.
