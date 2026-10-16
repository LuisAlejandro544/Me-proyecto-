# README AI — guía rápida para asistentes de código

> Si eres un agente (OpenCode, Copilot, Cursor, etc.), empieza aquí y sigue a
> `AI_CONTEXT.md` (contratos) + `STRUCTURE.md` (mapa) + `ROADMAP.md` (qué falta).

## Arranque en 60 segundos

```bash
npm install && npm run dev      # http://localhost:1420
npm run build && npm run check  # verificación obligatoria (0 errores)
```

## Las 5 cosas que debes saber

1. **No renombres ids** de `src/components/StudioShell.svelte` — el JS los busca.
2. **`initStudio()`** corre en `onMount`, es idempotente; el canvas nunca en top-level.
3. **Estado en `ctx`** (`lib/studio/context.ts`): muta con `pushHistory()` antes y
   `renderNodes()` después (el snapshot incluye `scenes`, `startNodeId`,
   `dialogueThemeId` para deshacer/rehacer).
4. **Nodos**: plantilla en `ui/render-nodes.ts` (con `.vn-scene-tag` 🎬),
   edición en `ui/node-editor.ts` (sección 🎬 + `gotoSceneId` por opción),
   cables en `ui/render-wires.ts` + `domain/geometry.ts`, escenas en
   `domain/scenes.ts` + `ui/scenes.ts` (pestaña `scenes`).
5. **Compartir**: `ui/share.ts` codifica `{ permiso:'jugar', state }` (con
   `startNodeId` + `scenes`) en
   `#nivel=<base64url>` con base pública (nunca `localhost`) y lo abre con
   carga + fullscreen (`shared-play-mode`); hay `.html` jugable sin servidor.
6. **Pantallas completas**: `CompositionStudio.svelte` se monta en `App.svelte`
   (eventos `vn:open-composer`/`vn:close-composer`), NO en el drawer; los
   assets llevan `tags` con `setAssetTags`/`getAllAssetTags`.

## Recetas

**Editar un nodo (pregunta/personaje/opciones):**
`ui/node-editor.ts → openNodeEditor()` — formulario por `node.type`, con
personaje desde `getCharacterCatalog()`, sección 🎬 (escena, salto al continuar,
inicio/fin) y `gotoSceneId` por opción de decisión, con borrado con `deleteNode()`.

**Crear/renombrar escenas (fin de una + inicio de la siguiente + salto directo):**
`ui/scenes.ts → openScenesStudio()` (pestaña `scenes`) — nombre personalizable +
`startNodeId`/`endNodeId` por escena; lógica en `domain/scenes.ts`
(`resolveSceneStartNode`/`resolveContinueSceneTarget`); el reproductor
(`playtest.ts`) y el `.html` (`compile.ts`) resuelven igual (cable primero,
escena después).

**Eliminar un nodo y sus cables:**
`deleteNode(id)` (toolbar 🗑, editor o `Supr`) — filtra `nodes` y `wires`,
reasigna `selectedNodeId`, `renderNodes()` + toast.

**Arreglar un puerto desalineado:**
mueve el `style="left/right: -9px; top: …"` en `render-nodes.ts`, revisa
`getPortPosition()` y el `z-index`/`overflow` en `app.css` (`.vn-node`,
`.vn-port`, `.vn-choice-row`).

**Pulir móvil:**
`StudioShell.svelte` (header truncado, footer con scroll, modales `92dvh` +
safe-area) + `app.css` (`@media 640px/380px`, `pointer: coarse`, toast y popover).
El lienzo es GPU: no reconstruyas cables en gestos (usa `updateWirePaths` en drag
y nada en pan/pinch/zoom); el minimapa va con `scheduleMinimap()`.

**Compartir nivel:**
`openShareModal()` (selector de permiso + copiar) → `buildShareUrl()` →
el invitado entra por `checkSharedPlayModeOnBoot()` → `enterSharedPlayMode()`
(progreso `#shareLoading`, `body.shared-play-mode`, `renderPlaytestStep`).

**Compilar novela (`.html` / `.vn.json` / Windows / Linux):**
`ui/compile.ts → openCompileModal()` — valida con `validateStory()` (incluye
escenas), genera con
`buildStandaloneHtml()` / `buildHistoria()` (ambos con `scenes`), guarda con `saveTextFile()` y
arma paquetes (`exportWindowsPackage` / `exportLinuxPackage`). Los 3 botones
(`#btnExportExe`/`#btnExportHtml`/`#btnExportLinux`) van a este modal desde
`index.ts`. No dupliques el generador: `exporter.ts`/`share.ts` delegan aquí.
El binario `.exe` real es Rust/Tauri (`src-tauri/src/main.rs`) vía
`npm run tauri:build` o workflow manual `bundle-desktop.yml`.

**Auto-update:**
`ui/updater.ts → checkForUpdates()` (compara `tag_name` de `releases/latest`
con `__APP_VERSION__`) → `UpdateModal.svelte` (`#updateModal`). No toques los
disparadores del workflow: solo `release: published` + `workflow_dispatch`
(nunca push/PR).

## Qué no hacer

- No toques `my_novel_visual_novel_node_studio.html` salvo para consultar.
- No muevas el wiring del canvas fuera de `wireCanvasPanZoom()`.
- No quites `// @ts-nocheck` de un módulo sin tiparlo entero con `types.ts`.
- No commitees `node_modules/`, `dist/`, `package-lock.json` ni binarios (ver `AGENTS.md`).

## Dónde está cada cosa

Ver `STRUCTURE.md` (tabla «Dónde tocar según la tarea») y `docs/ARCHITECTURE.md`
para decisiones (ADRs en `docs/DECISIONS.md`).
