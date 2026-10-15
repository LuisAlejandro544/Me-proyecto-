# Structure — mapa del repositorio

```text
Me-proyecto-/
├── README.md / ROADMAP.md / STRUCTURE.md / AI_CONTEXT.md / README_AI.md / AGENTS.md
├── CHANGELOG.md / LICENSE / AGENTS.md
├── docs/  ARCHITECTURE.md  DECISIONS.md  CONTRIBUTING.md  RELEASING.md
├── index.html  vite.config.ts  svelte.config.js  tailwind.config.js  postcss.config.js
├── src/
│   ├── main.ts               punto de entrada Vite
│   ├── app.css               estilos portados + puertos + toolbar + móvil + share-play
│   ├── App.svelte            shell mínimo → StudioShell
│   ├── components/
│   │   └── StudioShell.svelte  chrome completo (ids INTACTOS, no renombrar)
│   │       ├── header        #btnResetView #btnProjectDropdown #currentProjectLabel
│   │       │                 #projectDropdownMenu .preset-option
│   │       │                 #btnShareLevel #btnPlayPreviewTop #btnUndo #btnRedo
│   │       │                 #btnZoomResetTop #topZoomLabel #btnExportExe
│   │       │                 #btnExportHtml #btnTopSettings
│   │       ├── main#canvasViewport  lienzo
│   │       │   ├── #pillPresetSora #pillPresetAoi
│   │       │   ├── #panLayer > #canvasWorld > svg#wiresSvg > g#wiresLayer
│   │       │   │   └── path#tempDragWire
│   │       │   ├── #nodesLayer  (tarjetas .vn-node generadas por render-nodes.ts)
│   │       │   ├── #btnZoomOutPill #pillZoomLabel #btnCenterCanvas #btnFitGraph
│   │       │   └── #btnFabAddNode + #minimapSvg #btnMinimapZoomOut/In
│   │       ├── footer.nav      .nav-tab-btn[data-tab=nodes|assets|timeline|characters|playtest|settings]
│   │       ├── #drawerModal   #drawerModalTitle #drawerModalBody #btnCloseDrawer
│   │       ├── #playtestModal #vnStageBg #vnCurrentNodeBadge #btnVnRestart
│   │       │                 #btnVnToggleAudio #btnClosePlaytest #vnSpriteContainer
│   │       │                 #vnCharacterSprite #vnChoicesOverlay #vnSpeakerName
│   │       │                 #vnExpressionTag #vnDialogueText #vnVariablesReadout #btnVnNext
│   │       ├── #shareLoading #shareLoadingMsg #shareLoadingBar #shareLoadingGame
│   │       └── #toastBanner #toastMessage (+ toast Svelte)
│   └── lib/
│       ├── types.ts          VNNode VNWire VNState GraphSnapshot DragState SfxKind
│       ├── platform.ts       isTauri/isCapacitor + saveHtmlExport (dialog/fs, Filesystem/Share)
│       ├── assets.ts         galería/cámara/archivos + getCharacterCatalog + resolveCharacter
│       └── studio/
│           ├── index.ts        initStudio() idempotente + wiring de botones + Supr + share-boot
│           ├── context.ts      ctx único { state, selectedNodeId, selectedWireId,
│           │                         historyStack, redoStack, sfxEnabled, dragState… }
│           ├── data/
│           │   ├── presets.ts  PRESET_SORA PRESET_AOI
│           │   └── assets.ts   CHARACTER_ASSETS (base64 sora/yuki/aoi/mio)
│           ├── domain/
│           │   ├── audio.ts    playSynthSfx
│           │   ├── geometry.ts getPortPosition buildBezierPath escapeHtml
│           │   └── history.ts  pushHistory (30 pasos)
│           └── ui/
│               ├── render-nodes.ts  6 tipos + toolbar ✏️/🗑 + puertos a -9px
│               │     banner_scene (in_main + portsOut) · choice (in/out por opción)
│               │     compact_scene · character_selector (in + out) · avatar_scene (in + outs)
│               │     branch_scene (in + out)
│               ├── node-editor.ts   openNodeEditor() por tipo + deleteNode() + duplicateNode()
│               ├── editors.ts       edición rápida inline (doble-clic / doble-toque)
│               ├── interactions.ts  drag nodos, drag cables, botones, doble-toque, Supr
│               ├── render-wires.ts  cables SVG + popover (Quitar/Color) + Shift+Clic borra
│               ├── viewport.ts      pan 1 dedo, pinch 2 dedos, inercia, zoom rueda/anclado
│               ├── transform.ts     setZoom/applyTransform (panLayer translate + world zoom)
│               ├── minimap.ts       renderMinimap
│               ├── load-preset.ts   loadPreset(sora|aoi|blank)
│               ├── playtest.ts      startPlaytest/renderPlaytestStep
│               ├── exporter.ts      exportStandaloneHtml + openExeExportModal
│               ├── workspace.ts     openWorkspaceTab + addNewNodeOfType + assets/timeline/chars
│               ├── share.ts         buildShareUrl/parseShareHash/openShareModal/
│               │                         enterSharedPlayMode/checkSharedPlayModeOnBoot
│               └── toast.ts         showToast
├── src-tauri/  tauri.conf.json (frontendDist ../dist) + main.rs + plugin-fs/dialog
├── android/    proyecto Capacitor (generado, no editar a mano; `npx cap sync`)
├── capacitor.config.ts
├── scripts/    bootstrap, check, build-all, package-web, release
├── .github/workflows/  web-check, release-web, tauri-linux, apk-debug
├── my_novel_visual_novel_node_studio.html  referencia legacy (NO borrar)
└── icon.svg    fuente de iconos
```

## Dónde tocar según la tarea

| Quiero… | Toco… |
|---|---|
| Cambiar cómo se ve un nodo | `ui/render-nodes.ts` + `app.css` (`.vn-node`, `.vn-port`, `.vn-node-toolbar`) |
| Añadir un campo editable | `ui/node-editor.ts` (`openNodeEditor`) + tipos en `lib/types.ts` |
| Cambiar borrar/duplicar | `ui/node-editor.ts` (`deleteNode`/`duplicateNode`) |
| Cambiar cables/puertos | `ui/render-nodes.ts` (posiciones) + `domain/geometry.ts` + `ui/render-wires.ts` |
| Cambiar gestos canvas | `ui/viewport.ts` + `ui/transform.ts` |
| Cambiar compartir/jugar | `ui/share.ts` + `StudioShell.svelte` (`#btnShareLevel`, `#shareLoading`, `#playtestModal`) + `app.css` (`shared-play-mode`) |
| Añadir pestaña inferior | `StudioShell.svelte` (footer) + `ui/workspace.ts` (`openWorkspaceTab`) |
| Cambiar export nativo | `lib/platform.ts` + `ui/exporter.ts` |
| Añadir personaje base | `studio/data/assets.ts` + `lib/assets.ts` |

## Reglas de ids y wiring

- Los `id` del chrome son contrato: `initStudio()` los busca con `getElementById`.
  No renombrar; si añades un botón, dale `id` y conéctalo en `index.ts`.
- `initStudio()` solo corre con DOM montado (`onMount`); nada de canvas en top-level.
- `ctx` es mutable legacy con `// @ts-nocheck` por módulo; el código nuevo usa
  `lib/types.ts` y entra por el barrel `lib/studio/index.ts`.
