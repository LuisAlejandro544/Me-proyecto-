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
   `renderNodes()` después.
4. **Nodos**: plantilla en `ui/render-nodes.ts`, edición en `ui/node-editor.ts`,
   cables en `ui/render-wires.ts` + `domain/geometry.ts`.
5. **Compartir**: `ui/share.ts` codifica `{ permiso:'jugar', state }` en
   `#nivel=<base64url>` con base pública (nunca `localhost`) y lo abre con
   carga + fullscreen (`shared-play-mode`); hay `.html` jugable sin servidor.

## Recetas

**Editar un nodo (pregunta/personaje/opciones):**
`ui/node-editor.ts → openNodeEditor()` — formulario por `node.type`, con
personaje desde `getCharacterCatalog()` y borrado con `deleteNode()`.

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
