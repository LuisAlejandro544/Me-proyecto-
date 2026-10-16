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
- **Etiquetas en Recursos 🏷**: cada asset admite hasta 12 etiquetas
  (`#fondo`, `#noche`…) con buscador por nombre/etiqueta, filtro por chips
  `#etiqueta · N` y edición inline con el botón 🏷.
- **Editor de composición 🎨**: pestaña *Componer* → pantalla completa
  independiente (no es un popup) con lienzo 16:9: elige fondo desde tus
  Recursos, sprites incluidos, galería o archivos, superpón sprites
  (arrastrar, tamaño, opacidad, espejo, orden de capas, duplicar) y pulsa
  **Guardar PNG** para renderizar a 1280×720 y archivarla en Recursos con
  etiquetas, lista para usar en nodos.
- **Bloque de vídeo 🎬**: nodo `video_scene` que reproduce un vídeo de la carpeta
  (galería de vídeos o administrador de archivos, `.mp4`/`.webm`/`.mov`) con
  autoplay, bucle, silencio y controles configurables.
- **Complemento de sonido 🔊**: nodo `sound_cue` que dispara un audio al entrar
  (música, ambiente o SFX, con volumen y bucle); cualquier escena admite además
  un audio extra opcional.
- **Nodos narrativos nuevos**: `jump` (↗️ salto directo a otra escena o nodo sin
  cable largo), `ending` (🏁 final contable bueno/malo/secreto/neutral con título
  y epílogo), `background` (🖼️ cambia el fondo del escenario con una imagen de
  la carpeta, persiste en los pasos siguientes), `narration` (📖 texto a pantalla
  completa sin hablante ni sprite), `monologue` (💭 pensamiento interno en
  cursiva con burbuja violeta), `wait` (⏳ pausa de 200–5000 ms con avance solo
  y botón Omitir) y `effect` (✨ flash, fundido a negro, sacudida, zoom,
  corazones, lluvia, nieve o chispas). Se crean en la pestaña *Nodos*, se editan
  con ✏️, se juegan en Probar/invitado/`.html` y se validan al compilar.
- **Probar en horizontal**: el botón Probar abre el reproductor en formato
  apaisado 16:9 (como se juega de verdad), con botón ⛶ de pantalla completa,
  aviso de girar el móvil y reproducción de vídeo/audio.
- **Eliminar nodos**: botón 🗑 en cada nodo, botón «Eliminar nodo» en el editor o
  tecla `Supr` / `Retroceso` (elimina también sus cables, con Deshacer disponible).
- **Escenas con nombre 🎬**: pestaña inferior **Escenas** → crea actos con nombre
  propio («Prólogo», «Bosque de noche»…), elige en qué nodo **termina** cada escena
  y en qué nodo **empieza** la siguiente; al jugar, «Continuar» sin cable salta
  solo a la siguiente escena. Desde ✏️ Editar nodo asignas su escena, marcas su
  inicio/fin y defines «al continuar, ir a…»; en los nodos de **decisión** cada
  opción puede **ir directo a otra escena** sin cable. Las tarjetas muestran la
  etiqueta 🎬 con marcas INICIO/FIN y el reproductor indica `🎬 Escena · paso N`.
- **Cuadros de diálogo personalizables 💬**: pestaña inferior **Diálogos** (+ tarjeta
  en Ajustes + botón en ✏️ Editar nodo) con 6 diseños base + diseños propios con
  imagen de fondo importada, 14 tipografías y 8 animaciones de letras
  (máquina de escribir, fundido, ola, rebote, arcoíris…); tema global del proyecto
  + override por nodo; se aplica en Probar, modo invitado y `.html`/`.vn.json`.
- **Animaciones de assets y escenarios 🎞**: cada nodo define **aparición** del
  sprite/vídeo (fundido, deslizares, zoom, rebote, enfoque, volteo…),
  **movimiento continuo** en bucle (flotar, balanceo, saltitos, pulso, respirar,
  temblor, giro lento…) y **transición de escenario** al llegar (fundido,
  deslizares, zoom, desenfoque, barrido, corte seco); cada **escena** tiene su
  transición de entrada y **Ajustes** guarda los valores **globales** + duración
  (120–2000 ms). Las tarjetas muestran insignia 🎞, se juega en Probar, invitado
  y `.html` compilado, y se respeta `prefers-reduced-motion`.
- **Conectar nodos**: arrastra desde cualquier puerto (●) hasta otro puerto.
  Clic en un cable para cambiar color o quitarlo; `Shift+Clic` o doble-clic lo borra.
- **Compartir nivel**: botón **Compartir** en la cabecera → se genera una URL
  **compartible** (nunca `localhost`: si estás en local se usa tu dirección
  pública editable, p. ej. GitHub Pages) → tu amigo ve pantallas de carga y juega
  a pantalla completa sin editor. Si el nivel pesa mucho (vídeos), usa
  «📦 .html jugable» para enviarlo como archivo sin servidor.
- **Compilar novela**: modal **Compilar novela** (botones `Win (.exe)` /
  `Web (.html)` / `Linux` en la cabecera) con 4 formatos: `.html` jugable
  autocontenido (doble clic, sin servidor), `.vn.json` portable (grafo +
  assets para importar/respaldar), paquete Windows (`.html` + `Iniciar_*.bat`
  que sí juega al doble clic) y paquete Linux (`.html` + `jugar-*.sh` con
  `chmod +x` + `.desktop`). Incluye validación previa (errores que bloquean +
  avisos de ramas sin cable, nodos inalcanzables y recursos rotos), tamaño
  estimado y guardado nativo (Tauri `dialog`/`fs`, Capacitor `Filesystem`/
  `Share`, descarga web).
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

## Desktop — Tauri v2 + Rust → .exe / Linux reales

El navegador **no puede fabricar un `.exe`/`.AppImage` binario por sí solo**
(sería un agujero de seguridad). Por eso hay dos vías, ambas documentadas en
el modal «Compilar novela»:

1. **Descarga inmediata y funcional** (sin instalar nada): el `.html` jugable +
   lanzador (`Iniciar_*.bat` en Windows, `jugar-*.sh` + `.desktop` en Linux).
   Doble clic → juega en el navegador.
2. **Binario nativo** (instalador real): el lenguaje específico que compila es
   **Rust** vía Tauri (`src-tauri/src/main.rs`, `plugin-fs/dialog/opener`).
   Se compila con:

```bash
npm run tauri:dev    # dev con WebView
npm run tauri:build  # → src-tauri/target/release/bundle/ (.exe, .AppImage, .dmg)
```

O sin PC: Actions → **`Bundle escritorio (.exe + Linux)`** (solo manual,
nunca en push/PR) → Windows (NSIS/MSI) + Linux (`.deb`/`.AppImage`) en
Artifacts. Repártelos junto a tu `.html`/`.vn.json`.

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

Formato: `https://tu-dominio-publico/#nivel=<base64url>` con `{ v, permiso, proyecto, state }`.

- Permiso actual: `jugar` (ver + jugar a pantalla completa, sin editar).
- Al abrirlo: pantalla de carga con progreso → reproductor a pantalla completa
  (`body.shared-play-mode` oculta editor/cabecera/pie).
- **Adiós al `localhost`**: si desarrollas en `localhost`/IP local/`file://`, el
  modal ya no genera enlaces locales (que nadie más puede abrir). Usa tu URL
  pública (por defecto `https://luisalejandro544.github.io/Me-proyecto-/`,
  editable y guardada en `localStorage` → `vn_share_base_url_v1`).
- Sin servidor: botón «📦 .html jugable» (nivel incrustado, con vídeo/audio)
  para enviar por chat/correo.
- Límite práctico: ~8 KB de URL; con vídeos se supera rápido y el modal avisa
  y recomienda el `.html`.

## Actualizaciones automáticas

- La app revisa `releases/latest` en GitHub al arrancar (1 vez/24h) y con el
  botón **Buscar actualizaciones** (`#btnCheckUpdates` en la cabecera).
- Si hay versión nueva muestra la pantalla **«Nueva actualización disponible»**
  (`#updateModal`) con barra de progreso y estado: **Instalar actualización**
  (escritorio: descarga el instalador de tu sistema y lo abre para actualizar
  de verdad; Android: descarga el APK y abre el instalador) / **Recargar app**
  (web: aplica la versión ya publicada, con limpieza de caché) / Ver release /
  Omitir / Recordar mañana. El repo a vigilar se cambia en Ajustes o con `VITE_UPDATE_REPO`.
- Ojo honesto: el `.zip` es el **portable y NO se auto-instala** (descargarlo
  no actualiza nada por sí solo). Si el release no trae instalador de tu
  plataforma, la app lo dice en vez de fingir.
- El canal lo alimenta el workflow **`Auto-update`**: SOLO corre al publicar un
  release o manual (nunca por commits/PRs) y adjunta al release el `.zip` web
  de toda la app + `.zip` del código + `update.json`/`latest.json` +
  `SHA256SUMS.txt` (versión = tag). Si compilas instaladores nativos y los
  subes al release, la app los usa para actualizar. Detalle en
  `docs/RELEASING.md`.

## Estructura resumida

```text
src/App.svelte                  shell mínimo
src/components/StudioShell.svelte  chrome (ids intactos, NO renombrar)
src/components/BottomNav.svelte    pie con pestañas (Nodos, Recursos, Componer, Cronología, Personajes, Escenas, Diálogos, Probar, Ajustes)
src/lib/types.ts                VNNode (+assetEnter/assetMotion/sceneTransition +jumpSceneId/jumpNodeId +endingKind/endingTitle +backgroundAssetId +waitMs +effectKind/effectDurationMs, EndingKind/EffectKind), VNWire, VNState (+startNodeId, +scenes/VNScene, +defaults de animación), VNScene (+enterTransition)
src/lib/asset-animations.ts     apariciones + movimientos + transiciones (listas, resolvers, CSS compartido)
src/lib/dialogue-themes.ts      biblioteca de diseños de diálogo + tipografías + animaciones
src/lib/assets.ts               galería/cámara/archivos + etiquetas (#tag) de assets
src/lib/compositions.ts         composiciones fondo+sprites + render a PNG 1280×720
src/components/CompositionStudio.svelte  editor de escenas a pantalla completa (#composerScreen)
src/lib/studio/context.ts       estado mutable único
src/lib/studio/domain/scenes.ts escenas (ensure/normalize/create/rename/delete/move + resolución de saltos)
src/lib/studio/ui/scenes.ts     estudio de escenas (nombre + inicio/fin + transición de entrada + jugar desde + reordenar)
src/lib/studio/ui/render-nodes.ts  tarjetas + puertos + toolbar ✏️/🗑 (+ etiqueta 🎬 de escena + insignia 🎞 de animación + 7 nodos nuevos en cards/system.ts: jump/ending/background/narration/monologue/wait/effect)
src/lib/studio/ui/node-editor.ts   editor completo + eliminar/duplicar (+ escena por nodo + salto por opción + sección 🎞 de animaciones + formularios jump/ending/background/narration/monologue/wait/effect)
src/lib/studio/ui/dialogue.ts      estudio de diálogos personalizados
src/lib/studio/ui/share.ts         URL para jugar + carga + fullscreen (incluye scenes + startNodeId)
src/lib/studio/ui/render-wires.ts  cables SVG + popover
src/lib/studio/ui/compile.ts      compilador (buildStandaloneHtml/buildHistoria/validateStory/saveTextFile + modal + paquetes Win/Linux)
src/lib/studio/ui/exporter.ts     compat (delega a compile.ts) · ui/share.ts delega el .html al generador único
src/lib/studio/ui/updater.ts      chequeo de releases/latest + pantalla #updateModal
src/components/UpdateModal.svelte pantalla «Nueva actualización disponible»
src/lib/platform.ts             Tauri dialog/fs + Capacitor Filesystem/Share
my_novel_visual_novel_node_studio.html  referencia legacy (no borrar)
```

Ver `STRUCTURE.md` para el mapa completo y `AI_CONTEXT.md` / `README_AI.md` para
trabajar con IA.

## Notas de port

- `App.svelte onMount(initStudio)` reemplaza `DOMContentLoaded`.
  `initStudio()` es idempotente (guard `__studioInited`); el wiring de pan/zoom vive
  en `wireCanvasPanZoom()` y debe correr con el DOM montado, nunca en el import.
- Zoom por GPU (`#panLayer` traslada, `#canvasWorld` escala con `transform`):
  pan/pinch/zoom solo tocan el compositor (60fps en móvil); los cables SVG escalan
  solos y solo se tocan al arrastrar nodos (`updateWirePaths`) o cambiar el grafo.
