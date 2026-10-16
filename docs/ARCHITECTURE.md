# Arquitectura

```
┌ web (Vite + Svelte + TS) ── dist/ ──┬── Tauri v2 ── .exe/.deb/.AppImage
│                                     └── Capacitor 7 ── APK (android/)
└ legacy: my_novel_visual_novel_node_studio.html (referencia, no se toca)
```

Donde viven los elementos de UI:
- **Toda la UI** (top bar, canvas, nodos, wires, modales, playtest, bottom nav)
  vive en `src/` (Svelte + TypeScript, único stack).

- Una sola base web (`src/`) alimenta desktop y móvil.
- `src/App.svelte` es solo el shell: monta `components/StudioShell.svelte` (chrome: header, canvas, footer, modales).
- `src/components/CompositionStudio.svelte` es pantalla completa independiente
  (`#composerScreen`, `fixed inset-0 z-[80]`): NO vive en el drawer. `App.svelte`
  la monta bajo `{#if showComposer}` y la abre/cierra con los eventos
  `vn:open-composer` / `vn:close-composer` que dispara `openWorkspaceTab('compositor')`.
- `src/lib/compositions.ts`: `Composition { background, bgFit, layers[] }` en
  `localStorage (vn_compositions_v1)` + `renderCompositionToDataUrl()` (canvas
  1280×720, fondo cover/contain/stretch + capas con opacidad/espejo) →
  `saveCustomAssetFromDataUrl()` la archiva en Recursos con etiquetas.
- `src/lib/assets.ts`: `CustomAsset.tags: string[]` (`normalizeTags`,
  `setAssetTags`, `getAllAssetTags`); el drawer (`workspace.ts`, pestaña
  `assets`) filtra por chips `[data-tag-filter]` y edita inline con
  `[data-edit-tags]`.
- `src/lib/studio/` — lógica del editor partida por dominios (ver mapa abajo). Barrel: `index.ts` (`initStudio()`, `getStudioState()`).
- Lienzo por GPU: `#panLayer` traslada y `#canvasWorld` escala con `transform`
  (compositor, sin re-layout). Los cables SVG viven dentro del mundo y escalan
  solos: pan/pinch/zoom no tocan el DOM; el drag actualiza solo `d`
  (`updateWirePaths`); el minimapa va diferido (`scheduleMinimap`).
- `src/lib/platform.ts` = puente de export nativo (Tauri dialog/fs, Capacitor Filesystem/Share).
- Estado canónico del grafo: tipos en `src/lib/types.ts` (`VNScene` + `VNNode.sceneId/nextSceneId` + `ChoiceOption.gotoSceneId`); estado mutable legacy centralizado en `studio/context.ts`.
- Escenas narrativas (`studio/domain/scenes.ts` + `studio/ui/scenes.ts`): nombre
  personalizable + `startNodeId` (dónde empieza) + `endNodeId` (dónde termina);
  pestaña `scenes` del footer (`BottomNav.svelte` → `openWorkspaceTab` →
  `openScenesStudio`); las tarjetas llevan `.vn-scene-tag` 🎬 (INICIO/FIN) y el
  editor por nodo (`node-editor.ts`) asigna escena + `nextSceneId` + `gotoSceneId`
  por opción. Jugar (`playtest.ts`) y exportar (`compile.ts`, mismo algoritmo en
  el `.html`) priorizan el cable y, sin cable, saltan a la escena
  (`resolveContinueSceneTarget` / `resolveSceneStartNode`); `share.ts` y
  `.vn.json` incluyen `scenes` + `startNodeId`.

Reproductor: `playtest.ts` abre el modal en horizontal 16:9 (`#vnPlaytestCard`)
con `<video>` para `video_scene` y `<audio>` para `sound_cue`/`audioAssetId`
(+ insignia `🎬 Escena` y botón `Continuar → 🎬 Siguiente`);
`share.ts` genera URLs compartibles (base pública, nunca localhost, con `scenes`) o un
`.html` jugable con el nivel incrustado.

Compilador (`ui/compile.ts`, fuente única): `buildStandaloneHtml()` (novela
jugable autocontenida `file://`: `startNodeId` real, **escenas con saltos
(`scenes` + `nextSceneId`/`gotoSceneId` + etiqueta `🎬 Escena`)**, variables, audio/vídeo,
decisiones `out_*`, continuar con teclado, reinicio, contador de pasos y solo
assets usados) + `buildHistoria()` (`.vn.json` portable: grafo + `scenes` + variables +
assets) + `validateStory()` (errores que bloquean + avisos, incluye escenas: nombres, inicios rotos, vacías) + `saveTextFile()`
(Tauri `dialog`/`fs` → Capacitor `Filesystem`/`Share` → descarga web) +
`openCompileModal()` (selector `.html`/`.vn.json`/Windows/Linux, validación
visible, tamaño estimado, progreso) + `exportWindowsPackage()` (`.html` +
`Iniciar_*.bat`) + `exportLinuxPackage()` (`.html` + `jugar-*.sh` + `.desktop`).
`ui/exporter.ts` y el `.html` de `share.ts` delegan aquí. Botones
`#btnExportExe`/`#btnExportHtml`/`#btnExportLinux` cableados en `index.ts`.
El `.exe`/`.AppImage`/`.deb` binario real lo compila **Rust** vía Tauri
(`src-tauri/src/main.rs`, `tauri.conf.json` con `bundle targets: all`):
`npm run tauri:build` en local o workflow manual `bundle-desktop.yml`
(Windows NSIS/MSI + Linux .deb/.AppImage → Artifacts).

```text
src/lib/studio/
├── index.ts        # orquesta: initStudio(), getStudioState(), wiring top-bar
├── context.ts      # ÚNICO estado mutable legacy (ctx.*)
├── data/           # assets.ts (sprites), presets.ts (Sora/Aoi con scenes)
├── domain/         # audio.ts, history.ts, geometry.ts (puros + DOM queries),
│                   # scenes.ts (VNScene + resolvers de saltos)
└── ui/             # render-nodes, render-wires, interactions, viewport,
                    # transform, minimap, editors, node-editor (+🎬), scenes,
                    # dialogue, playtest (+saltos), workspace (+scenes),
                    # compile (fuente única + escenas), exporter (compat), load-preset, share (+scenes), updater, toast
src/components/
├── StudioShell.svelte  # compone todo + onMount(initStudio)
├── TopBar.svelte, CanvasChrome.svelte, BottomNav.svelte
├── DrawerModal.svelte, PlaytestModal.svelte, ShareLoading.svelte, ToastBanner.svelte
├── UpdateModal.svelte  # pantalla «Nueva actualización disponible» (#updateModal)
└── (Fase 2: NodeCard/* por tipo de nodo)
```

Auto-update: `ui/updater.ts` compara `tag_name` de `releases/latest` con
`__APP_VERSION__` (inyectada en `vite.config.ts`) y abre `UpdateModal.svelte`;
el workflow `auto-update.yml` SOLO corre al publicar un release o manual
(nunca por push/PR) y adjunta al release el `.zip` web + `.zip` fuente +
`update.json`.

**Fase 2 (pendiente):** migrar cada tipo de nodo a componente Svelte (`NodeCard/*`) y el estado a stores (`lib/stores/project.svelte.ts`); `context.ts` es el seam para hacerlo por slices.

Ver también: `docs/DECISIONS.md` (por qué este stack), `docs/RELEASING.md` (cómo publicar).
