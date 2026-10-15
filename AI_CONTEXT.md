# AI Context — instrucciones para agentes

> Lee esto antes de tocar código. Responde al usuario en español.

## Qué es

Visual Novel Node Studio: editor de grafos (escenas/decisiones/personajes) en
Svelte + Vite, con lienzo pan/zoom, cables SVG, playtest en móvil y compartir por
URL (`#nivel=`) para jugar a pantalla completa. Desktop vía Tauri v2, móvil vía
Capacitor 7. Referencia legacy: `my_novel_visual_novel_node_studio.html` (no borrar).

## Contratos que no debes romper

1. **Ids del chrome**: `src/components/StudioShell.svelte` tiene ids que
   `src/lib/studio/index.ts` y los módulos `ui/*` buscan por `getElementById`.
   No los renombres. Lista completa en `STRUCTURE.md`.
2. **`initStudio()` idempotente** y solo con DOM montado (`onMount` en
   `StudioShell.svelte`). Nada de wiring de canvas en top-level del módulo.
3. **`ctx` mutable único** (`lib/studio/context.ts`); historial con `pushHistory()`
   antes de mutar; tras mutar llama `renderNodes()` (que re-renderiza cables).
4. **`// @ts-nocheck`** en módulos legacy: no lo quites a medias; el código nuevo
   tipa con `src/lib/types.ts` (`VNNode`, `VNWire`, `VNState`).
5. **Verificación obligatoria**: `npm run build` + `npm run check` (0 errores).

## Mapa mental rápido

- Entrada: `src/main.ts` → `App.svelte` → `StudioShell.svelte` (`onMount(initStudio)`).
- Estado: `context.ts` → `ctx.state: VNState { projectName, zoom, panX, panY,
  variables, nodes, wires }`.
- Nodos (`ui/render-nodes.ts`): `banner_scene`, `choice`, `compact_scene`,
  `character_selector`, `avatar_scene`, `branch_scene`. Cada tarjeta lleva
  `.vn-node-toolbar` (✏️ `edit-node`, 🗑 `delete-node`) y `.vn-port` a `-9px` con
  `data-node-id/data-port-id/data-port-dir/data-port-color`.
- Edición: `ui/node-editor.ts` (`openNodeEditor`, `deleteNode`, `duplicateNode`) +
  `ui/editors.ts` (inline doble-clic/doble-toque) + `ui/interactions.ts`
  (drag, botones, `Supr`).
- Cables: `domain/geometry.ts` (`getPortPosition` vía DOM + `zoom`, `buildBezierPath`)
  + `ui/render-wires.ts` (glow, hit-area 22px, popover Quitar/Color).
  Rebuild completo solo al cambiar el grafo (`renderWires`); en drag de nodo usa
  la vía rápida `updateWirePaths(nodeId)` (solo toca `d`); en pan/pinch/zoom no
  se tocan (escalan con el mundo por GPU). Minimapa diferido (`scheduleMinimap`,
  omitido en móvil donde está oculto).
- Canvas: `ui/viewport.ts` (pan 1 dedo, pinch, inercia, zoom anclado, rueda
  coalescada en un rAF, rect del viewport cacheado) + `ui/transform.ts`
  (`panLayer` translate GPU + `canvasWorld` scale GPU). Durante el gesto se pone
  `body.vn-gesturing` (apaga `backdrop-filter`, glow y transiciones).
- Compartir: `ui/share.ts` — `buildShareUrl('jugar')` → `#nivel=<b64url>` →
  `parseShareHash` → `enterSharedPlayMode` (pantallas `#shareLoading` + clase
  `body.shared-play-mode` + `renderPlaytestStep`) → `checkSharedPlayModeOnBoot`.
- Plataforma: `lib/platform.ts`; assets: `lib/assets.ts` + `studio/data/assets.ts`.

## Patrones de edición

- Nuevo campo de nodo: añade a `VNNode` en `types.ts`, píntalo en
  `render-nodes.ts`, edítalo en `node-editor.ts` (y en `playtest.ts`/`exporter.ts`
  si afecta a jugar/exportar).
- Nuevo puerto: `data-port-id` único por nodo; respeta convención
  `in_*` (entrada) / `out_*` (salida); en `choice` es `in_<optId>` / `out_<optId>`.
- Nuevo botón de cabecera/pie: añade en `StudioShell.svelte` con `id`, conéctalo en
  `index.ts`, dale `min-height: 44px` en móvil.
- Estilos: Tailwind en el markup + `src/app.css` para `.vn-*`, `#wirePopover`,
  `#shareLoading`, `shared-play-mode` y media queries `640px/380px`.

## Límites conocidos

- URL compartida ~8 KB máximo práctico; con imágenes base64 grandes avisa en el modal.
- `getPortPosition` depende del DOM: tras cambiar nodos llama `renderNodes()` y deja
  que `requestAnimationFrame(renderWires)` re-calcule.
- No commitear: `node_modules/`, `dist/`, `src-tauri/target/`, `src-tauri/gen/`,
  `package-lock.json`, `src-tauri/Cargo.lock`, iconos generados (ver `.gitignore`).
