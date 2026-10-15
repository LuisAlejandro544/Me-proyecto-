# Structure — mapa del repositorio

```text
Me-proyecto-/
├── README.md / ROADMAP.md / STRUCTURE.md / AI_CONTEXT.md / README_AI.md / AGENTS.md
├── CHANGELOG.md / LICENSE / AGENTS.md
├── docs/  ARCHITECTURE.md  DECISIONS.md  CONTRIBUTING.md  RELEASING.md
├── index.html  vite.config.ts  svelte.config.js  tailwind.config.js  postcss.config.js
├── src/
│   ├── main.ts               punto de entrada Vite
│   ├── app.css               estilos portados + puertos + toolbar + móvil + share-play + playtest-horizontal
│   ├── App.svelte            shell mínimo → menú principal o StudioShell
│   ├── components/
│   │   ├── MainMenu.svelte     #mainMenu (continuar/autosave + 3 slots locales + nombre)
│   │   └── StudioShell.svelte  chrome completo (ids INTACTOS, no renombrar)
│   │       ├── header        #btnGoHome #btnResetView #btnProjectDropdown #currentProjectLabel
│   │       │                 #projectNameInput .slot-save-btn[data-slot-save]
│   │       │                 #projectDropdownMenu .preset-option
│   │       │                 #btnShareLevel #btnPlayPreviewTop #btnUndo #btnRedo
│   │       │                 #btnZoomResetTop #topZoomLabel #btnExportExe
│   │       │                 #btnExportHtml #btnTopSettings #btnCheckUpdates #updateDot
│   │       │                 (+ #updateModal #updateVersionBadge #btnDownloadUpdate)
│   │       ├── main#canvasViewport  lienzo
│   │       │   ├── #pillPresetSora #pillPresetAoi
│   │       │   ├── #panLayer > #canvasWorld > svg#wiresSvg > g#wiresLayer
│   │       │   │   └── path#tempDragWire
│   │       │   ├── #nodesLayer  (tarjetas .vn-node generadas por render-nodes.ts)
│   │       │   ├── #btnZoomOutPill #pillZoomLabel #btnCenterCanvas #btnFitGraph
│   │       │   └── #btnFabAddNode + #minimapSvg #btnMinimapZoomOut/In
│   │       ├── footer.nav      .nav-tab-btn[data-tab=nodes|assets|timeline|characters|playtest|settings]
│   │       ├── #drawerModal   #drawerModalTitle #drawerModalBody #btnCloseDrawer
│   │       ├── #playtestModal #vnPlaytestCard.vn-playtest-landscape #vnStageBg
│   │       │                 #vnCurrentNodeBadge #btnVnRestart #btnVnToggleAudio
│   │       │                 #btnVnFullscreen #btnClosePlaytest #vnSpriteContainer
│   │       │                 #vnCharacterSprite #vnVideoPlayer #vnAudioPlayer
│   │       │                 #vnRotateHint #vnChoicesOverlay #vnSpeakerName
│   │       │                 #vnExpressionTag #vnDialogueText #vnVariablesReadout #btnVnNext
│   │       │                 (drawer comparte #shareBase #shareHtml)
│   │       ├── #shareLoading #shareLoadingMsg #shareLoadingBar #shareLoadingGame
│   │       │   └── #updateModal (pantalla auto-update) + #toastBanner #toastMessage
│   └── lib/
│       ├── types.ts          VNNode (+video/audio/sound) VNWire VNState (+startNodeId) GraphSnapshot DragState SfxKind
│       ├── platform.ts       isTauri/isCapacitor + saveHtmlExport (dialog/fs, Filesystem/Share)
│       ├── assets.ts         galería (fotos+vídeos)/cámara/archivos (imagen+vídeo+audio) + catálogos
│       └── studio/
│           ├── index.ts        initStudio() idempotente + wiring de botones + Supr + share-boot + enterEditor()
│           ├── context.ts      ctx único { state, selectedNodeId, selectedWireId,
│           │                         historyStack, redoStack, sfxEnabled, dragState… }
│           ├── storage.ts      slots locales (3) + autosave + nombre + startNodeId
│           │                         (loadSlots/saveSlot/clearSlot, scheduleAutosave,
│           │                         applyLoadedState, renameProject, get/setStartNodeId)
│           ├── data/
│           │   ├── presets.ts  PRESET_SORA PRESET_AOI
│           │   └── assets.ts   CHARACTER_ASSETS (base64 sora/yuki/aoi/mio)
│           ├── domain/
│           │   ├── audio.ts    playSynthSfx
│           │   ├── geometry.ts getPortPosition buildBezierPath escapeHtml
│           │   └── history.ts  pushHistory (30 pasos)
│           └── ui/
│               ├── render-nodes.ts  8 tipos + toolbar ✏️/▶/🗑 + insignia ▶ INICIO + puertos a -9px
│               │     banner_scene (in_main + portsOut repartidos %) · choice (in_main + out por opción; punto izq. decorativo)
│               │     compact_scene · character_selector (in + out) · avatar_scene (in + outs)
│               │     branch_scene (in + out) · video_scene (in + out, 🎬) · sound_cue (in + out, 🔊)
│               ├── node-editor.ts   openNodeEditor() por tipo + deleteNode() + duplicateNode()
│               ├── editors.ts       edición rápida inline (doble-clic / doble-toque)
│               ├── interactions.ts  drag nodos, drag cables, botones, doble-toque, Supr
│               ├── render-wires.ts  cables SVG + popover (Quitar/Color) + Shift+Clic borra
│               │                     + updateWirePaths() (vía rápida drag) + scheduleMinimap()
│               ├── viewport.ts      pan 1 dedo, pinch 2 dedos, inercia, zoom rueda/anclado
│               │                     (rAF único, rect cacheado, sin rebuild de cables en el gesto)
│               ├── transform.ts     setZoom/applyTransform (panLayer translate GPU + world scale GPU)
│               ├── minimap.ts       renderMinimap
│               ├── load-preset.ts   loadPreset(sora|aoi|blank)
│               ├── playtest.ts      startPlaytest/closePlaytest/renderPlaytestStep (horizontal 16:9 + <video>/<audio>)
│               ├── exporter.ts      exportStandaloneHtml (+vídeo/audio) + openExeExportModal
│               ├── workspace.ts     openWorkspaceTab + addNewNodeOfType + assets/timeline/chars
│               ├── share.ts         getShareBaseUrl/isLocalOrPrivateHost/buildShareUrl/
│               │                         parseShareHash/openShareModal (base editable + .html)/
│               │               downloadPlayableHtml/enterSharedPlayMode/checkSharedPlayModeOnBoot
│               ├── updater.ts       check GitHub releases/latest + pantalla #updateModal
│               │                     + descarga .zip (Tauri save/fs, Capacitor Share)
│               └── toast.ts         showToast
├── src-tauri/  tauri.conf.json (frontendDist ../dist) + main.rs + plugin-fs/dialog
├── android/    proyecto Capacitor (generado, no editar a mano; `npx cap sync`)
├── capacitor.config.ts
├── scripts/    bootstrap, check, build-all, package-web, release
├── .github/workflows/  web-check (push/PR), release-web (manual), auto-update (SOLO release publicado + manual, nunca push/PR), tauri-linux (manual), apk-debug (manual)
├── my_novel_visual_novel_node_studio.html  referencia legacy (NO borrar)
└── icon.svg    fuente de iconos
```

## Dónde tocar según la tarea

| Quiero… | Toco… |
|---|---|
| Cambiar cómo se ve un nodo | `ui/render-nodes.ts` + `app.css` (`.vn-node`, `.vn-port`, `.vn-node-toolbar`) |
| Añadir un campo editable | `ui/node-editor.ts` (`openNodeEditor`) + tipos en `lib/types.ts` |
| Cambiar borrar/duplicar | `ui/node-editor.ts` (`deleteNode`/`duplicateNode`) |
| Cambiar cables/puertos | `ui/render-nodes.ts` (posiciones) + `domain/geometry.ts` + `ui/render-wires.ts` (`renderWires` rebuild completo, `updateWirePaths` en drag) |
| Cambiar gestos canvas | `ui/viewport.ts` + `ui/transform.ts` (GPU: translate + scale; `body.vn-gesturing` apaga blur/glow) |
| Cambiar compartir/jugar | `ui/share.ts` + `StudioShell.svelte` (`#btnShareLevel`, `#shareLoading`, `#playtestModal`) + `app.css` (`shared-play-mode`) |
| Añadir pestaña inferior | `StudioShell.svelte` (footer) + `ui/workspace.ts` (`openWorkspaceTab`) |
| Cambiar export nativo | `lib/platform.ts` + `ui/exporter.ts` |
| Cambiar auto-update | `ui/updater.ts` + `components/UpdateModal.svelte` (`#updateModal`) + workflow `auto-update.yml` (solo `release: published` + `workflow_dispatch`; ver `docs/RELEASING.md`) |
| Añadir personaje base | `studio/data/assets.ts` + `lib/assets.ts` |

## Reglas de ids y wiring

- Los `id` del chrome son contrato: `initStudio()` los busca con `getElementById`.
  No renombrar; si añades un botón, dale `id` y conéctalo en `index.ts`.
- `initStudio()` solo corre con DOM montado (`onMount`); nada de canvas en top-level.
- `ctx` es mutable legacy con `// @ts-nocheck` por módulo; el código nuevo usa
  `lib/types.ts` y entra por el barrel `lib/studio/index.ts`.
