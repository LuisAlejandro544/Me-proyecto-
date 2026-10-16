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
│   ├── App.svelte            shell mínimo → menú principal o StudioShell (+ CompositionStudio a pantalla completa)
│   ├── components/
│   │   ├── MainMenu.svelte     #mainMenu (continuar/autosave + 3 slots locales + nombre)
│   │   ├── CompositionStudio.svelte  editor de escenas (#composerScreen: #btnComposerBack/#btnComposerNew/#btnComposerSave; fondo + sprites → PNG a Recursos)
│   │   └── StudioShell.svelte  chrome completo (ids INTACTOS, no renombrar)
│   │       ├── header        #btnGoHome #btnResetView #btnProjectDropdown #currentProjectLabel
│   │       │                 #projectNameInput .slot-save-btn[data-slot-save]
│   │       │                 #projectDropdownMenu .preset-option
│   │       │                 #btnShareLevel #btnPlayPreviewTop #btnUndo #btnRedo
│   │       │                 #btnZoomResetTop #topZoomLabel #btnImportar (abre ExportProjectModal vía vn:open-export)
│   │       │                 #btnTopSettings #btnCheckUpdates #updateDot
│   │       │                 (+ #updateModal #updateVersionBadge #btnDownloadUpdate)
│   │       ├── main#canvasViewport  lienzo
│   │       │   ├── #pillPresetSora #pillPresetAoi
│   │       │   ├── #panLayer > #canvasWorld > svg#wiresSvg > g#wiresLayer
│   │       │   │   └── path#tempDragWire
│   │       │   ├── #nodesLayer  (tarjetas .vn-node generadas por render-nodes.ts)
│   │       │   ├── #btnZoomOutPill #pillZoomLabel #btnCenterCanvas #btnFitGraph
│   │       │   └── #btnFabAddNode + #minimapSvg #btnMinimapZoomOut/In
│   │       ├── footer.nav      .nav-tab-btn[data-tab=nodes|assets|compositor|timeline|characters|scenes|dialogues|playtest|settings]
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
│       ├── types.ts          VNNode (+sceneId/nextSceneId/dlg* +assetEnter/assetMotion/sceneTransition +jumpSceneId/jumpNodeId +endingKind/endingTitle +backgroundAssetId +waitMs +effectKind/effectDurationMs, EndingKind/EffectKind) VNWire VNScene (+enterTransition) VNState (+startNodeId/dialogueThemeId/scenes +defaults de animación) GraphSnapshot (+scenes) DragState SfxKind
│       ├── asset-animations.ts  9 apariciones + 8 movimientos + 8 transiciones (listas + getProjectAssetDefaults/resolveNodeAssetAnim + assetAnimationsCss)
│       ├── dialogue-themes.ts  biblioteca de diseños de diálogo (6 base + propios) + 14 fuentes + 8 animaciones
│       ├── platform.ts       isTauri/isCapacitor + saveHtmlExport (dialog/fs, Filesystem/Share)
│       ├── assets.ts         barrel + assets/{types,store,catalog,import-files,import-media,tags}.ts (galería/cámara/archivos + catálogos + etiquetas)
│       ├── compositions.ts   Composition/CompositionLayer (fondo+sprites) + persistencia + renderCompositionToDataUrl (PNG 1280×720)
│       └── studio/
│           ├── index.ts        initStudio() idempotente + wiring de botones + Supr + share-boot + enterEditor()
│           ├── context.ts      ctx único { state, selectedNodeId, selectedWireId,
│           │                         historyStack, redoStack, sfxEnabled, dragState… }
│           ├── storage.ts      slots locales (3) + autosave + nombre + startNodeId
│           │                         (loadSlots/saveSlot/clearSlot, scheduleAutosave,
│           │                         applyLoadedState, renameProject, get/setStartNodeId)
│           ├── data/
│           │   ├── presets.ts  PRESET_SORA PRESET_AOI
│           │   ├── assets.ts   barrel + characters/{sora,yuki,aoi,mio}.ts (base64 estático, un archivo por personaje)
│           ├── domain/
│           │   ├── audio.ts    playSynthSfx
│           │   ├── geometry.ts getPortPosition buildBezierPath escapeHtml
│           │   ├── scenes.ts   VNScene (ensure/normalize/create/rename/delete/move + resolveSceneStartNode/resolveContinueSceneTarget)
│           │   └── history.ts  pushHistory (30 pasos)
│           └── ui/  (dioses partidos en subcarpeta + barrel fino; detalle abajo)
│               ├── render-nodes.ts  orquestador + cards/{toolbar,banner,selector,avatar,branch,video,sound,system}.ts (15 tipos + toolbar ✏️/▶/🗑 + insignia ▶ INICIO + insignia 🎞 + puertos a -9px)
│               │     banner_scene (in_main + portsOut repartidos %) · choice (in_main + out por opción) · compact_scene · character_selector (in + out) · avatar_scene (in + outs)
│               │     branch_scene (in + out) · video_scene (in + out, 🎬) · sound_cue (in + out, 🔊)
│               │     jump (in + out, salto a nodo/escena) · ending (solo in, terminal contable) · background (in + out, fondo persistente) · narration (in + out, sin hablante)
│               │     monologue (in + out, cursiva) · wait (in + out, avance solo) · effect (in + out, flash/shake/partículas)
│               ├── node-editor.ts   barrel + node-editor/{fields,options,crud,form}.ts (openNodeEditor por tipo + deleteNode/duplicateNode + escena por nodo + sección 🎞 + formularios jump/ending/background/narration/monologue/wait/effect)
│               ├── scenes.ts        openScenesStudio() (nombre + inicio/fin por nodo + transición de entrada + orden + ver/jugar/eliminar)
│               ├── dialogue.ts      barrel + dialogue/{io,apply,studio}.ts (fondos + tema en playtest + estudio de diseños)
│               ├── editors.ts       edición rápida inline (doble-clic / doble-toque)
│               ├── interactions.ts  drag nodos, drag cables, botones, doble-toque, Supr
│               ├── render-wires.ts  cables SVG + popover (Quitar/Color) + Shift+Clic borra
│               │                     + updateWirePaths() (vía rápida drag) + scheduleMinimap()
│               ├── viewport.ts      ATÓMICO a propósito: máquina de estados de gestos (closures con sesión mutable compartida; partirlo añade indirección + riesgo en código sensible a timing) — pan 1 dedo, pinch 2 dedos, inercia, zoom rueda/anclado
│               │                     (rAF único, rect cacheado, sin rebuild de cables en el gesto)
│               ├── transform.ts     setZoom/applyTransform (panLayer translate GPU + world scale GPU)
│               ├── minimap.ts       renderMinimap
│               ├── load-preset.ts   loadPreset(sora|aoi|blank)
│               ├── playtest.ts      barrel + playtest/{media,anim,chrome,flow}.ts (start/close/paso + <video>/<audio> + 🎞 por nodo/escena/global + jump/ending/background/narration/monologue/wait/effect + playVisualEffect)
│               ├── compile.ts       barrel + compile/{types,validate,historia,standalone,files,modal}.ts (generador ÚNICO en standalone.ts + buildHistoria/validateStory/saveTextFile + paquetes Win/Linux + 7 nodos nuevos en .html y validación)
│               ├── exporter.ts      compat (delega a compile.ts: exportStandaloneHtml/openExeExportModal)
│               ├── workspace.ts     router fino + workspace/{state,tab-switch,folder,tab-nodes,tab-nodes-factory,tab-assets,tab-timeline,tab-characters,tab-settings}.ts
│               ├── share.ts         barrel + share/{codec,base,modal,play}.ts (getShareBaseUrl/isLocalOrPrivateHost/buildShareUrl/
│               │                         parseShareHash/openShareModal (base editable + .html vía compile.ts)/
│               │               downloadPlayableHtml/enterSharedPlayMode/checkSharedPlayModeOnBoot
│               ├── updater.ts       barrel + updater/{repo,version,assets,screen,check,boot}.ts (releases/latest + pantalla #updateModal + descarga .zip/instalador)
│               └── toast.ts         showToast
├── src-tauri/  tauri.conf.json (frontendDist ../dist, bundle targets all) + src/main.rs (Rust + plugin-fs/dialog/opener) + plugin-fs/dialog
├── android/    proyecto Capacitor (generado, no editar a mano; `npx cap sync`)
├── capacitor.config.ts
├── scripts/    bootstrap, check, build-all, package-web, release
├── .github/workflows/  web-check (push/PR), release-web (manual), auto-update (SOLO release publicado + manual, nunca push/PR), tauri-linux (manual), apk-debug (manual), bundle-desktop (SOLO manual: .exe NSIS/MSI en Windows + .deb/.AppImage en Linux → Artifacts)
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
| Cambiar compartir/jugar | `ui/share.ts` + `StudioShell.svelte` (`#btnShareLevel`, `#shareLoading`, `#playtestModal`) + `app.css` (`shared-play-mode`) + `domain/scenes.ts` (el reproductor resuelve Continuar/saltos por escena) |
| Añadir pestaña inferior | `StudioShell.svelte` (footer) + `ui/workspace.ts` (`openWorkspaceTab`) + `BottomNav.svelte` (`data-tab`) |
| Sistema de escenas | `lib/types.ts` (`VNScene`, `sceneId/nextSceneId/gotoSceneId`) + `domain/scenes.ts` + `ui/scenes.ts` (`openScenesStudio`) + `ui/node-editor.ts` (sección 🎬) + `ui/playtest.ts` + `ui/compile.ts` (mismos saltos en `.html`) |
| Animaciones de assets | `lib/asset-animations.ts` (listas + resolvers + CSS) + `types.ts` (`assetEnter/assetMotion/sceneTransition`, `enterTransition`, defaults globales) + `ui/node-editor.ts` (sección 🎞) + `ui/scenes.ts` (transición por escena) + `ui/workspace.ts` (Ajustes globales) + `ui/playtest.ts` + `ui/compile.ts` (mismo `assetAnimationsCss` en `.html`) + `app.css` (`.vn-asset-*`/`.vn-stage-*`/`.vn-anim-tag`) |
| Nueva pantalla completa (no popup) | `components/*.svelte` montado en `App.svelte` + evento `vn:open-*`/`vn:close-*` + `data-tab` en el footer (ver `CompositionStudio.svelte`) |
| Etiquetar assets | `lib/assets.ts` (`tags`, `setAssetTags`, `getAllAssetTags`) + chips `[data-tag-filter]` y botón `[data-edit-tags]` en `ui/workspace.ts` |
| Cambiar export nativo | `lib/platform.ts` + `ui/compile.ts` (generador único) + workflow `bundle-desktop.yml` (solo manual; Rust/Tauri compila el .exe/.deb/.AppImage real) |
| Cambiar compilar novela | `ui/compile.ts` (mismo + `ExportProjectModal.svelte`: 6 tarjetas Windows/Android/Linux/Vídeo/macOS/Web, evento `vn:open-export` desde `#btnImportar`) |
| Cambiar auto-update | `ui/updater.ts` + `components/UpdateModal.svelte` (`#updateModal`) + workflow `auto-update.yml` (solo `release: published` + `workflow_dispatch`; ver `docs/RELEASING.md`) |
| Añadir personaje base | `studio/data/assets.ts` + `lib/assets.ts` |

## Reglas de ids y wiring

- Los `id` del chrome son contrato: `initStudio()` los busca con `getElementById`.
  No renombrar; si añades un botón, dale `id` y conéctalo en `index.ts`.
- `initStudio()` solo corre con DOM montado (`onMount`); nada de canvas en top-level.
- `ctx` es mutable legacy con `// @ts-nocheck` por módulo; el código nuevo usa
  `lib/types.ts` y entra por el barrel `lib/studio/index.ts`.
