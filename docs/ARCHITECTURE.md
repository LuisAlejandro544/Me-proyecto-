# Arquitectura

```
┌ web (Vite + Svelte + TS) ── dist/ ──┬── Tauri v2 ── .exe/.deb/.AppImage
│                                     └── Capacitor 7 ── APK (android/)
└ legacy: my_novel_visual_novel_node_studio.html (referencia, no se toca)
```

- Una sola base web (`src/`) alimenta desktop y móvil.
- `src/App.svelte` monta el markup (ids intactos, los usa `studio.ts`).
- `src/lib/studio.ts` = lógica del editor; `initStudio()` se llama en `onMount` (nunca wiring DOM a top-level del módulo).
- `src/lib/platform.ts` = puente de export nativo (Tauri dialog/fs, Capacitor Filesystem/Share).
- Estado canónico del grafo: ver tipos en `src/lib/types.ts`.

Ver también: `docs/DECISIONS.md` (por qué este stack), `docs/RELEASING.md` (cómo publicar).
