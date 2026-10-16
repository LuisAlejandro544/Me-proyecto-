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
  `App.svelte` además monta `CompositionStudio.svelte` a pantalla completa con
  los eventos `vn:open-composer` / `vn:close-composer` (la pestaña `compositor`
  del footer NO abre el drawer, dispara el evento desde `openWorkspaceTab`).
- Estado: `context.ts` → `ctx.state: VNState { projectName, startNodeId,
  dialogueThemeId, defaultAssetEnter?, defaultAssetMotion?,
  defaultSceneTransition?, animDurationMs?, scenes: VNScene[], zoom, panX, panY,
  variables, nodes, wires }`.
- Escenas (`domain/scenes.ts` + `ui/scenes.ts`): `VNScene { id, name,
  startNodeId?, endNodeId? }`; nodos con `sceneId` + `nextSceneId`, opciones
  `choice` con `gotoSceneId` (salto directo sin cable). Continuar sin cable
  resuelve `resolveContinueSceneTarget()` (explícito → fin de escena → siguiente
  en orden). Pestaña `scenes` del footer (`BottomNav.svelte` + `openWorkspaceTab`).
- Nodos (`ui/render-nodes.ts`): `banner_scene`, `choice`, `compact_scene`,
  `character_selector`, `avatar_scene`, `branch_scene`, `video_scene` (🎬),
  `sound_cue` (🔊 complemento). Cada tarjeta lleva
  `.vn-node-toolbar` (✏️ `edit-node`, ▶ `set-start`, 🗑 `delete-node`),
  `.vn-scene-tag` (🎬 nombre + INICIO/FIN) + `.vn-anim-tag` (🎞 si el nodo tiene
  `assetEnter/assetMotion/sceneTransition`) + `.vn-port` a `-9px` con
  `data-node-id/data-port-id/data-port-dir/data-port-color`.
- Animaciones (`lib/asset-animations.ts`): 9 apariciones + 8 movimientos +
  8 transiciones; `getProjectAssetDefaults()` + `resolveNodeAssetAnim()` (nodo →
  escena `enterTransition` → global) + `assetAnimationsCss()` (mismo CSS en
  `app.css`, playtest y `.html`); respeta `prefers-reduced-motion`.
- Edición: `ui/node-editor.ts` (`openNodeEditor`, `deleteNode`, `duplicateNode`,
  sección 🎬 escena por nodo + `gotoSceneId` por opción + sección 🎞
  `assetEnter/assetMotion/sceneTransition`) +
  `ui/editors.ts` (inline doble-clic/doble-toque) + `ui/interactions.ts`
  (drag, botones, `Supr`).
- Cuadros de diálogo (`lib/dialogue-themes.ts` + `ui/dialogue.ts`): biblioteca con
  diseños base + propios (imagen), tipografías y animaciones; tema global
  `dialogueThemeId` + override por nodo (`dlgThemeId/dlgFont/dlgAnimation/…`);
  pestaña `dialogues` del footer y tarjeta en Ajustes.
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
- Compartir: `ui/share.ts` — `getShareBaseUrl()` (nunca localhost en local;
  base pública editable) → `buildShareUrl('jugar')` (incluye `startNodeId` +
  `scenes`) → `#nivel=<b64url>` →
  `parseShareHash` → `enterSharedPlayMode` (pantallas `#shareLoading` + clase
  `body.shared-play-mode` + `renderPlaytestStep`) → `checkSharedPlayModeOnBoot`.
  Alternativa sin servidor: `.html` jugable vía `ui/compile.ts`.
- Compilar (`ui/compile.ts`, fuente única): `buildStandaloneHtml()` (jugable
  `file://`: inicio real `startNodeId`, **escenas** (`scenes` + saltos
  `nextSceneId`/`gotoSceneId` + etiqueta `🎬 Escena`), variables, audio/vídeo, decisiones
  `out_*`, teclado, reinicio, solo assets usados) + `buildHistoria()`
  (`.vn.json` portable con `scenes`) + `validateStory()` (errores bloquean, avisos no;
  incluye escenas: nombres, inicios rotos, vacías) +
  `saveTextFile()` (Tauri `dialog`/`fs` → Capacitor `Filesystem`/`Share` →
  descarga web) + `openCompileModal()` (4 formatos + tamaño estimado) +
  `exportWindowsPackage()` (`.html` + `Iniciar_*.bat`) +
  `exportLinuxPackage()` (`.html` + `jugar-*.sh` + `.desktop`).
  `ui/exporter.ts` y el `.html` de `share.ts` delegan aquí (no duplicar).
  El `.exe`/`.AppImage`/`.deb` binario real NO sale del navegador: lo compila
  **Rust** vía Tauri (`src-tauri/src/main.rs`) con `npm run tauri:build` o el
  workflow manual `bundle-desktop.yml` (solo `workflow_dispatch`).
- Playtest horizontal: `#vnPlaytestCard.vn-playtest-landscape` (16:9) +
  `#vnVideoPlayer`/`#vnAudioPlayer` + `#btnVnFullscreen`/`closePlaytest()`;
  assets con vídeo: `lib/assets.ts` (`imagen|video|audio`); animaciones vía
  `applyAssetAnimations()` (aparición en el medio + movimiento en
  `#vnSpriteContainer` con posición en `translate`/`scale` + transición de
  `#vnStageBg` solo al cambiar de escena o forzarla por nodo).
- Plataforma: `lib/platform.ts`; assets: `lib/assets.ts` + `studio/data/assets.ts`.
  Los assets llevan `tags: string[]` (`normalizeTags`/`setAssetTags`/
  `getAllAssetTags`); la carpeta filtra por chips `[data-tag-filter]` y edita
  con `[data-edit-tags]`.
- Composición: `lib/compositions.ts` (`Composition` fondo + `layers`, `renderCompositionToDataUrl` a PNG 1280×720) +
  `components/CompositionStudio.svelte` (`#composerScreen`, pantalla completa
  independiente) → guarda con `saveCustomAssetFromDataUrl` (con etiquetas).
- Auto-update: `ui/updater.ts` (`fetchLatestRelease`/`checkForUpdates` contra
  `releases/latest`, respeta omitir/recordar-mañana en `localStorage`) +
  `components/UpdateModal.svelte` (`#updateModal`) + botón `#btnCheckUpdates`
  (`#updateDot`); el workflow `auto-update.yml` SOLO corre en release
  publicado o manual (nunca push/PR; ver `docs/RELEASING.md`).

## Patrones de edición

- Nuevo campo de nodo: añade a `VNNode` en `types.ts`, píntalo en
  `render-nodes.ts`, edítalo en `node-editor.ts` (y en `playtest.ts`/`compile.ts`
  si afecta a jugar/exportar). Para escenas usa `domain/scenes.ts`
  (`ensureScenes`/`normalizeScenes` + resolvers) y persiste en `storage.ts`,
  `history.ts`, undo/redo de `index.ts`, presets y `share.ts`. Para animaciones
  usa `lib/asset-animations.ts` (listas + resolvers + CSS) y no dupliques el CSS:
  importa `assetAnimationsCss()`.
- Nuevo puerto: `data-port-id` único por nodo; respeta convención
  `in_*` (entrada) / `out_*` (salida); en `choice` es `in_<optId>` / `out_<optId>`.
- Nuevo botón de cabecera/pie: añade en `StudioShell.svelte` con `id`, conéctalo en
  `index.ts`, dale `min-height: 44px` en móvil.
- Estilos: Tailwind en el markup + `src/app.css` para `.vn-*`, `#wirePopover`,
  `#shareLoading`, `shared-play-mode` y media queries `640px/380px`.

## Límites conocidos

- URL compartida ~8 KB máximo práctico; con imágenes/vídeos base64 grandes avisa
  en el modal y ofrece el `.html` jugable.
- `getPortPosition` depende del DOM: tras cambiar nodos llama `renderNodes()` y deja
  que `requestAnimationFrame(renderWires)` re-calcule.
- No commitear: `node_modules/`, `dist/`, `src-tauri/target/`, `src-tauri/gen/`,
  `package-lock.json`, `src-tauri/Cargo.lock`, iconos generados (ver `.gitignore`).
