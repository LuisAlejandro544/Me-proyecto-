# Changelog — formato Keep a Changelog

## [Unreleased]
### Added
- Animaciones de assets y escenarios 🎞 (`lib/asset-animations.ts` + tipos `assetEnter/assetMotion/sceneTransition` por nodo, `enterTransition` por escena y globales `defaultAssetEnter/defaultAssetMotion/defaultSceneTransition/animDurationMs` en `VNState`): 9 apariciones (fundido, deslizares, zoom, rebote, enfoque, volteo…), 8 movimientos continuos (flotar, balanceo, saltitos, pulso, respirar, temblor, giro lento…) y 8 transiciones de escenario (fundido, deslizares, zoom, desenfoque, barrido, corte seco). Incluye sección 🎞 en ✏️ Editar nodo, transición de entrada en el estudio de Escenas, tarjeta de valores globales + duración (120–2000 ms) en Ajustes, insignia 🎞 en las tarjetas, saneo en `normalizeScenes()`, aplicación en Probar (`applyAssetAnimations`: aparición + movimiento en `#vnSpriteContainer` + transición de `#vnStageBg` al cambiar de escena), modo invitado y `.html` compilado (mismo `assetAnimationsCss()` + `prefers-reduced-motion`), y persistencia en `#nivel=`, `.vn.json` y slots/autosave
### Added
- Sistema de escenas 🎬 (`types.VNScene` + `domain/scenes.ts` + `ui/scenes.ts` + pestaña inferior `Escenas`): cada escena tiene **nombre personalizable** + **nodo donde empieza** (`startNodeId`) + **nodo donde termina** (`endNodeId`); al jugar, «Continuar» sin cable salta solo a la siguiente escena en orden, cualquier nodo puede continuar hacia una escena con `nextSceneId` y cada opción de una **decisión puede ir directo a otra escena** con `gotoSceneId` (sin cable). Incluye etiquetas 🎬 en las tarjetas (nombre + marcas INICIO/FIN), editor por nodo (✏️ → «🎬 Escena»: pertenencia, salto al continuar, botones de marcar inicio/fin), estudio de escenas (crear/renombrar con input, reordenar ▲▼, ver inicio ◎, jugar desde ▶, eliminar), validación en `validateStory` (nombres vacíos/duplicados, inicios rotos, escenas vacías), persistencia en slots/autosave/deshacer/rehacer, enlace compartido `#nivel=` y `.html`/`.vn.json` compilados (el `.html` resuelve los mismos saltos y muestra `🎬 Escena · paso N`)
- Cuadros de diálogo personalizados (`lib/dialogue-themes.ts` + `ui/dialogue.ts`): biblioteca con 6 diseños base + diseños propios con imagen de fondo importada, 14 tipografías y 8 animaciones de letras (máquina de escribir, fundido, ola, rebote, arcoíris…); tema global del proyecto (`VNState.dialogueThemeId`) + override por nodo desde ✏️ Editar nodo, pestaña inferior «Diálogos» y tarjeta en Ajustes; se aplica en Probar, modo invitado y `.html`/`.vn.json` compilados (el `.html` incrusta diseños usados + animaciones y funciona en `file://`)
- Compilador de novelas (`ui/compile.ts` + modal «Compilar novela»): generador `.html` único y completo (inicio real con `startNodeId`, variables, audio/vídeo, decisiones con `out_<opt>`, continuar con teclado, reinicio, contador de pasos y solo assets usados para pesar menos), formato portable `.vn.json`, validación previa (errores que bloquean + avisos de ramas sin cable, nodos inalcanzables y recursos rotos) con tamaño estimado, guardado nativo (Tauri `dialog`/`fs`, Capacitor `Filesystem`/`Share`, descarga web) y paquetes funcionales Windows (`.html` + `Iniciar_*.bat` que sí juega) y Linux (`.html` + `jugar-*.sh` + `.desktop`); nuevo botón `#btnExportLinux` y workflow manual «Bundle escritorio (.exe + Linux)» (Windows NSIS/MSI + Linux .deb/.AppImage en Artifacts)
### Fixed
- Auto-actualizaciones: descargar el `.zip` NO actualizaba nada (solo guardaba el archivo). Ahora la pantalla `#updateModal` descarga el **instalador nativo de tu plataforma y lo abre** (Tauri vía `plugin-opener`, Android vía APK) para actualizar de verdad; en web el botón **Recargar app** hace hard-reload con limpieza de caché; el `.zip` queda como portable y la app lo dice claro cuando no hay instalador. Incluye barra de progreso/estado, plan B a `update.json` directo si la API de GitHub va con rate-limit y manifiestos `update.json`/`latest.json` + `SHA256SUMS.txt` con versión = tag
### Added
- Editor de composición 🎨 a pantalla completa independiente (`components/CompositionStudio.svelte` `#composerScreen` + `lib/compositions.ts`): pestaña *Componer* en el pie, lienzo 16:9 con fondo (Recursos, sprites incluidos, galería o archivos) + sprites superpuestos arrastrables (tamaño, opacidad, espejo, orden, duplicar) y **Guardar PNG** (1280×720) en la carpeta de Recursos con etiquetas
- Etiquetas 🏷 en la carpeta (`CustomAsset.tags` + `normalizeTags`/`setAssetTags`/`getAllAssetTags`/`saveCustomAssetFromDataUrl`): chips `#etiqueta · N` para filtrar, buscador por nombre/etiqueta y edición inline (🏷) por tarjeta
### Added
- Menú principal (`components/MainMenu.svelte`): al entrar se muestra «Mis Historias» con Continuar donde la dejé (autosave `vn_autosave_v1`) + 3 slots en almacenamiento local (`vn_slots_v1`); nombre personalizable por historia/slot e historia nueva (en blanco o presets Sora/Aoi); botón 🏠 `#btnGoHome` para volver al menú (guarda sesión) y `#projectNameInput` + `.slot-save-btn` en el desplegable del editor
- Nodo inicial de partida (`VNState.startNodeId`): botón ▶/🟢 en la toolbar de cada nodo + insignia «▶ INICIO» + botón en el editor completo; Jugar, Reiniciar, enlace compartido y `.html` jugable empiezan ahí (fallback al primer nodo)
### Added
- Auto-actualizaciones: workflow `Auto-update` (solo al publicar un release o manual, nunca por push/PR) adjunta al release el .zip web de toda la app + .zip del código + `update.json`; la app escanea `releases/latest`, compara versión y muestra la pantalla «Nueva actualización disponible» (`#updateModal`) con Descargar .zip / Recargar / Ver release, botón `#btnCheckUpdates` (+ `#updateDot`) y tarjeta en Ajustes con repo editable
### Changed
- Chrome a componentes Svelte (TopBar, CanvasChrome, BottomNav, modales, toast); ids intactos, paridad verificada
### Added
- Bloque de vídeo (`video_scene` 🎬): reproduce vídeos de la carpeta con autoplay/bucle/silencio/controles; tarjeta, editor, playtest y export `.html`
- Nodo complemento de sonido (`sound_cue` 🔊): dispara audio al entrar (volumen + bucle); audio extra opcional en cualquier escena
- Carpeta de recursos con vídeos (galería de vídeos + administrador de archivos, `.mp4`/`.webm`/`.mov`) y audios (archivos, `.mp3`/`.wav`/`.ogg`/`.m4a`); filtros Todos/Imágenes/Vídeos/Audios y asignación al nodo seleccionado
- Probar en horizontal 16:9 (`#vnPlaytestCard.vn-playtest-landscape` + `#vnVideoPlayer`/`#vnAudioPlayer` + `#btnVnFullscreen` + aviso `#vnRotateHint`)
- Compartir sin `localhost`: base pública editable (`vn_share_base_url_v1`, `getShareBaseUrl`/`isLocalOrPrivateHost`) + botón «📦 .html jugable» (`downloadPlayableHtml`) para enviar sin servidor
### Removed
- Shell C++ (`cpp/`) y port Qt (`qt/` ya retirado): stack único TypeScript; Tauri cubre desktop
- Importación de recursos (imágenes/audio) desde galería o administrador de archivos en web, PC (diálogo nativo Tauri) y móvil (galería/cámara Capacitor + respaldo a selector del sistema); módulo `src/lib/assets.ts` con persistencia local
- Editor completo de nodos (`ui/node-editor.ts`): pregunta/diálogo, hablante y color, personaje y expresión, escala/posición y opciones de `choice` (añadir/quitar), con duplicar y eliminar
- Eliminación de nodos: botón 🗑 por nodo + tecla `Supr`/`Retroceso`, borra sus cables y admite Deshacer
- Compartir nivel por URL (`ui/share.ts` + `#btnShareLevel`): modal con selector de permisos (por ahora `Solo jugar`), copiar enlace `#nivel=`, pantallas de carga con progreso y modo invitado a pantalla completa (`shared-play-mode`)
- Docs raíz: `ROADMAP.md`, `STRUCTURE.md`, `AI_CONTEXT.md`, `README_AI.md`; `README.md` y `AGENTS.md` actualizados
### Changed
- `src/lib/studio.ts` monolítico → `src/lib/studio/{data,domain,ui}/` + `context.ts` (paridad verificada); chrome a `components/StudioShell.svelte`
- Lienzo rápido en móvil: zoom por GPU (`transform: scale`, sin CSS `zoom`); pan/pinch/zoom ya no reconstruyen cables (escalan solos), el drag de nodos solo actualiza el `d` de sus cables (`updateWirePaths`), rueda coalescada en un rAF, minimapa diferido y sin blur/glow durante el gesto (`body.vn-gesturing`); filtros gaussianos desactivados en táctil
- Interfaz completa traducida al español (cabecera, lienzo, pestañas, paneles, previsualización, exportaciones y presets de ejemplo)
### Fixed
- Móvil: la cabecera ya no solapa el título con Compartir (acciones en segunda fila con scroll en <640px, `order-*` + `.topbar-actions`); título hasta `38vw`, desplegable acotado a `100vw-1rem`, targets de 44px y URL compartible seleccionable (`onfocus select` + `user-select:text` en `#shareUrl`)
- Zoom borroso/lento en móvil: antes layout-zoom (CSS `zoom` + rebuild de cables por frame); ahora `transform: scale` por GPU con cables dentro del mundo (nítidos 35%–200% a 60fps)
- Conectores: puertos re-centrados a `-9px` en el borde, `overflow: visible` y `z-index` 40 (los de `choice` ya no quedan a `-21px` ni se cortan); entrada añadida en `avatar_scene`/`banner_scene` y salida en `character_selector`
- Nodos escena/elección: `choice` con entrada única real (`in_main`) y puntos izquierdos decorativos (ya no son conectores dentro de la píldora); salidas `out_*` centradas en el borde (`-23px` por el `p-3.5`) y cabecera con hueco para ✏️/🗑; `banner_scene`/`avatar_scene` con salidas repartidas en % del borde (adiós `yOffset` fijo en la esquina); cables viejos `in_<opt>` redirigidos a `in_main` (`geometry.ts`)
- Móvil: cabecera compacta con truncado, pie con scroll horizontal (Personajes visible), modales `92dvh` + safe-area, toast sobre el pie, puertos de 18px en táctil y doble-toque para editar textos

## [0.1.0] — 2026-10-15
### Added
- Migración del monolito HTML a Web + TypeScript + Svelte (Vite 6)
- Target desktop vía Tauri v2 y móvil vía Capacitor 7
- Plataforma Android (`android/`) + workflow manual de APK debug
- Workflows: `web-check`, `release-web`, `tauri-linux`, `apk-debug`
- Scripts `scripts/` (bootstrap, check, build-all, package-web, release)
- Agente OpenCode (`opencode.yml`) + `AGENTS.md`
