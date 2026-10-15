# My Novel — Visual Novel Node Studio (Web + TS + Svelte → Tauri + Capacitor)

![web-check](https://github.com/LuisAlejandro544/Me-proyecto-/actions/workflows/web-check.yml/badge.svg)
![license](https://img.shields.io/github/license/LuisAlejandro544/Me-proyecto-)

Estudio de nodos para novelas visuales: edita escenas, decisiones y personajes en un
lienzo con cables neón, prueba la historia en el móvil y **compártela con un enlace
para jugar a pantalla completa**.

> Documentación: `STRUCTURE.md` · `ROADMAP.md` · `AI_CONTEXT.md` · `README_AI.md` ·
> `AGENTS.md` · `docs/ARCHITECTURE.md` · `docs/DECISIONS.md` · `docs/CONTRIBUTING.md` ·
> `docs/RELEASING.md` · `CHANGELOG.md`

## Qué puedes hacer

- **Editar nodos**: toca ✏️ en cualquier nodo (o doble-clic / doble-toque en el texto)
  para cambiar pregunta/diálogo, hablante, colores, personaje, expresión, tamaño,
  posición y opciones de respuesta.
- **Elegir personaje**: selector en el propio nodo, en el editor completo o en las
  pestañas *Recursos* / *Personajes* (incluye importar tus fotos desde galería,
  archivos o cámara en móvil).
- **Eliminar nodos**: botón 🗑 en cada nodo, botón «Eliminar nodo» en el editor o
  tecla `Supr` / `Retroceso` (elimina también sus cables, con Deshacer disponible).
- **Conectar nodos**: arrastra desde cualquier puerto (●) hasta otro puerto.
  Clic en un cable para cambiar color o quitarlo; `Shift+Clic` o doble-clic lo borra.
- **Compartir nivel**: botón **Compartir** en la cabecera → elige permiso
  (por ahora *Solo jugar*) → copia la URL → tu amigo ve pantallas de carga y juega
  a pantalla completa sin editor.
- **Exportar**: Web autónoma (`.html`), manifiesto Windows (`.bat`, binario real vía
  Tauri) y JSON del proyecto.

## Web (Vite + Svelte + TS)

```bash
npm install      # regenera package-lock.json (ignorado en git)
npm run dev      # http://localhost:1420
npm run build    # → dist/
npm run preview
npm run check    # svelte-check, 0 errores
```

## Desktop — Tauri v2 → .exe real

El botón «Win (.exe)» antes solo bajaba un `.bat`. El binario real sale de Tauri:

```bash
npm run tauri:dev    # dev con WebView
npm run tauri:build  # → src-tauri/target/release/bundle/ (.exe, .AppImage, .dmg)
```

Config: `src-tauri/tauri.conf.json` (`frontendDist: ../dist`),
`src-tauri/src/main.rs` + `plugin-fs/dialog`.
Iconos: `npx tauri icon ./icon.svg`.

## Mobile — Capacitor 7 → Android/iOS

Mismo `dist/` compartido:

```bash
npm run build
npx cap add android   # una vez
npx cap add ios       # una vez (en mac)
npx cap sync          # copia dist/ a nativo
npx cap open android  # abre Android Studio
```

En móvil la cabecera se compacta, el pie de pestañas tiene desplazamiento horizontal,
el minimapa se oculta y los puertos crecen para el dedo (`pointer: coarse`).

## Enlace para jugar

Formato: `https://tu-dominio/#nivel=<base64url>` con `{ v, permiso, proyecto, state }`.

- Permiso actual: `jugar` (ver + jugar a pantalla completa, sin editar).
- Al abrirlo: pantalla de carga con progreso → reproductor a pantalla completa
  (`body.shared-play-mode` oculta editor/cabecera/pie).
- Límite práctico: ~8 KB de URL; si el nivel es enorme se avisa en el modal.

## Estructura resumida

```text
src/App.svelte                  shell mínimo
src/components/StudioShell.svelte  chrome (ids intactos, NO renombrar)
src/lib/types.ts                VNNode, VNWire, VNState
src/lib/studio/context.ts       estado mutable único
src/lib/studio/ui/render-nodes.ts  tarjetas + puertos + toolbar ✏️/🗑
src/lib/studio/ui/node-editor.ts   editor completo + eliminar/duplicar
src/lib/studio/ui/share.ts         URL para jugar + carga + fullscreen
src/lib/studio/ui/render-wires.ts  cables SVG + popover
src/lib/platform.ts             Tauri dialog/fs + Capacitor Filesystem/Share
my_novel_visual_novel_node_studio.html  referencia legacy (no borrar)
```

Ver `STRUCTURE.md` para el mapa completo y `AI_CONTEXT.md` / `README_AI.md` para
trabajar con IA.

## Notas de port

- `App.svelte onMount(initStudio)` reemplaza `DOMContentLoaded`.
  `initStudio()` es idempotente (guard `__studioInited`); el wiring de pan/zoom vive
  en `wireCanvasPanZoom()` y debe correr con el DOM montado, nunca en el import.
- Zoom nítido por layout (`#panLayer` traslada, `#canvasWorld` usa CSS `zoom`).
