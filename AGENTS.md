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
- `src/App.svelte` — shell mínimo, monta `components/StudioShell.svelte`
- `src/components/StudioShell.svelte` — chrome portado (ids intactos, NO renombrar ids;
  mapa en `STRUCTURE.md`; nuevo: `#btnShareLevel`, `#shareLoading`)
- `src/lib/studio/` — módulos por dominio (`data/`, `domain/`, `ui/`); barrel `index.ts`; estado en `context.ts`
  - `ui/render-nodes.ts` — tarjetas + toolbar ✏️/🗑 + puertos a `-9px` visibles
  - `ui/node-editor.ts` — `openNodeEditor` / `deleteNode` / `duplicateNode`
  - `ui/share.ts` — URL `#nivel=` (permiso `jugar`) + carga + `shared-play-mode`
  - `ui/render-wires.ts` + `domain/geometry.ts` — cables y posiciones de puertos
    (`renderWires` solo al cambiar el grafo; `updateWirePaths` en drag; nada en pan/zoom)
  - `ui/viewport.ts` + `ui/transform.ts` — pan/pinch/zoom GPU (pan en `#panLayer`, scale en `#canvasWorld`, `body.vn-gesturing` en el gesto)
- `src/lib/types.ts` — tipos `VNNode`, `VNWire`, `VNState` (usar en código nuevo)
- `src/lib/assets.ts` — `getCharacterCatalog` / `resolveCharacter` + import galería/cámara
- `src/lib/platform.ts` — export nativo (Tauri `dialog`/`fs`, Capacitor `Filesystem`/`Share`)
- `my_novel_visual_novel_node_studio.html` — referencia legacy, no borrar
- `icon.svg` — fuente de iconos (`npx tauri icon ./icon.svg` los regenera)

## Reglas
- `initStudio()` es idempotente y debe correr con el DOM montado (`onMount`); jamás mover wiring de canvas al top-level del módulo (rompe el import: `canvasViewport` es null).
- Mutar grafos con `pushHistory()` antes y `renderNodes()` después; convención de puertos `in_*`/`out_*` (`choice`: `in_<optId>`/`out_<optId>`).
- Botones nuevos: `id` en el shell + wiring en `index.ts` + `min-height: 44px` en móvil.
- Verificar siempre con `npm run build` + `npm run check` antes de dar por hecho un cambio.
- NO commitear: `node_modules/`, `dist/`, `src-tauri/target/`, `src-tauri/gen/`, `package-lock.json`, `src-tauri/Cargo.lock`, sets de iconos Android/iOS/Store (ver `.gitignore`).
- Commits cortos en español. PRs contra `main` con descripción breve + cómo se verificó.
- Docs: `README.md`, `ROADMAP.md`, `STRUCTURE.md`, `AI_CONTEXT.md`, `README_AI.md`, `AGENTS.md` (raíz) y `docs/` (arquitectura, ADRs, contribuir, publicar) + `CHANGELOG.md` (`[Unreleased]`).
