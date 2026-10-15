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
- `src/lib/studio/` — lógica del editor partida por dominios (ver mapa abajo). Barrel: `index.ts` (`initStudio()`, `getStudioState()`).
- Lienzo por GPU: `#panLayer` traslada y `#canvasWorld` escala con `transform`
  (compositor, sin re-layout). Los cables SVG viven dentro del mundo y escalan
  solos: pan/pinch/zoom no tocan el DOM; el drag actualiza solo `d`
  (`updateWirePaths`); el minimapa va diferido (`scheduleMinimap`).
- `src/lib/platform.ts` = puente de export nativo (Tauri dialog/fs, Capacitor Filesystem/Share).
- Estado canónico del grafo: tipos en `src/lib/types.ts`; estado mutable legacy centralizado en `studio/context.ts`.

Reproductor: `playtest.ts` abre el modal en horizontal 16:9 (`#vnPlaytestCard`)
con `<video>` para `video_scene` y `<audio>` para `sound_cue`/`audioAssetId`;
`share.ts` genera URLs compartibles (base pública, nunca localhost) o un
`.html` jugable con el nivel incrustado.

```text
src/lib/studio/
├── index.ts        # orquesta: initStudio(), getStudioState(), wiring top-bar
├── context.ts      # ÚNICO estado mutable legacy (ctx.*)
├── data/           # assets.ts (sprites), presets.ts (Sora/Aoi)
├── domain/         # audio.ts, history.ts, geometry.ts (puros + DOM queries)
└── ui/             # render-nodes, render-wires, interactions, viewport,
                    # transform, minimap, editors, playtest, workspace,
                    # exporter, load-preset, share, updater, toast
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
