# Roadmap — Visual Novel Node Studio

> Estado a 2026-10-15. Hecho reciente: bloque de vídeo 🎬 + complemento de sonido 🔊
> (carpeta con galería de vídeos y audios), reproductor de prueba en horizontal 16:9,
> enlaces compartibles (adiós `localhost` + `.html` jugable), canal de
> auto-actualizaciones (workflow `Auto-update` solo en release publicado o manual
> + pantalla «Nueva actualización» en la app), editor de composición 🎨 a pantalla
> completa (fondo + sprites → PNG a Recursos), etiquetas 🏷 en la carpeta y
> **compilador de novelas** (`ui/compile.ts` + modal «Compilar novela»: `.html`
> jugable + `.vn.json` + paquetes funcionales Windows/Linux con validación) +
> workflow manual **`Bundle escritorio (.exe + Linux)`** (Rust/Tauri: NSIS/MSI +
> .deb/.AppImage en Artifacts).

## Ahora (v0.2) — compartir y pulir

- [x] Editar nodos: pregunta/diálogo, hablante, color, personaje, expresión, escala,
  posición y opciones (modal + doble-clic + doble-toque).
- [x] Eliminar nodos: botón 🗑, editor y tecla `Supr`, con Deshacer.
- [x] Conectores: puertos a `-9px` centrados en el borde, `overflow: visible`,
  `z-index` por encima, puerto de entrada en `avatar_scene`/`banner_scene` y salida
  en `character_selector`.
- [x] Móvil: cabecera compacta con truncado, pie con scroll horizontal, pestaña
  Personajes visible, modales `92dvh` + safe-area, toast sobre el pie, puertos de
  18px en táctil.
- [x] Compartir: botón **Compartir**, selector de permiso (solo `jugar` por ahora),
  copiar URL (`#nivel=` base64url), pantallas de carga con progreso y modo invitado
  a pantalla completa.
- [x] Lienzo rápido en móvil: zoom por GPU (`transform: scale`), pan/pinch/zoom sin
  rebuild de cables, drag con `updateWirePaths`, minimapa diferido y sin
  blur/glow durante el gesto.
- [x] Bloque de vídeo (`video_scene`) + nodo complemento de sonido (`sound_cue`);
  carpeta con vídeos (galería/archivos) y audios; editor y playtest los reproducen.
- [x] Probar en horizontal 16:9 + pantalla completa + aviso de rotación.
- [x] Compartir sin `localhost`: base pública editable + «📦 .html jugable»;
  aviso de URL larga (>8 KB, típico con vídeos).
- [x] Auto-actualizaciones: workflow `Auto-update` (solo release publicado o
  manual, nunca por commits/PRs) + chequeo en la app con pantalla
  «Nueva actualización disponible» (Descargar .zip / Recargar / Omitir).
- [x] Editor de composición 🎨 (pantalla completa `CompositionStudio.svelte`,
  `lib/compositions.ts`): fondo desde Recursos/sprites/galería/archivos +
  sprites superpuestos (drag, tamaño, opacidad, espejo, orden) → PNG 1280×720
  a la carpeta con etiquetas.
- [x] Etiquetas 🏷 en Recursos (`CustomAsset.tags`, `setAssetTags`,
  `getAllAssetTags`): chips `#tag · N`, buscador por nombre/etiqueta y edición
  inline.
- [x] Compilador de novelas (`ui/compile.ts` + modal «Compilar novela» con
  `#btnExportExe`/`#btnExportHtml`/`#btnExportLinux`): `.html` jugable único
  (inicio real, variables, audio/vídeo, decisiones `out_*`, teclado, reinicio,
  solo assets usados), `.vn.json` portable, validación (errores + avisos) con
  tamaño estimado y paquetes funcionales Windows (`.html` + `.bat`) y Linux
  (`.html` + `.sh` + `.desktop`); binario nativo vía Rust/Tauri en workflow
  manual `bundle-desktop.yml` (Windows NSIS/MSI + Linux .deb/.AppImage).
- [ ] Pruebas visuales del modo invitado en Android (WebView) y iOS (Safari).

## Siguiente (v0.3) — niveles y permisos

- [ ] Más permisos del enlace: `ver` (solo mirar), `comentar`, `editar` (con copia).
- [ ] Niveles cortos con código (`/j/AbC123`) guardados en backend o archivo, para
  URLs cortas en lugar de base64url gigante.
- [ ] Caducidad y revocación de enlaces.
- [ ] Miniaturas de nodos en el editor (vista previa del sprite).
- [ ] Validación del grafo avanzada: nodos sin salida, opciones sin cable, personajes rotos.
  (Base hecha: `validateStory()` en `compile.ts` ya avisa de ramas sin cable,
  inalcanzables y recursos rotos antes de compilar.)

## Después (v0.4+) — editor y plataformas

- [ ] Refactor a componentes Svelte (`TopBar`, `Canvas`, `NodeCard`, `PlaytestModal`)
  con stores en vez de `ctx` mutable + `// @ts-nocheck`.
- [ ] Historial por nodo y portapapeles (copiar/pegar nodos con Ctrl+C/V).
- [x] Audio por escena (campo opcional) y nodo de sonido; pendiente: transiciones de fondo.
- [x] Paquete funcional Windows/Linux descargable + workflow manual de bundles
  nativos (`bundle-desktop.yml`: Rust/Tauri en runners Windows/Ubuntu).
- [ ] Paquete Tauri firmado (.exe) y APK release en CI.
- [ ] Updater nativo en caliente (Tauri Updater con firma): hoy la pantalla
  «Nueva actualización» descarga el `.zip` y guía (recargar Pages / instalar
  próximo build), no sobrescribe el binario sola.
- [ ] i18n (es/en) y temas claro/oscuro.
- [ ] Tests: `svelte-check` + pruebas de geometría de puertos y de codificar/decoficar
  `#nivel=` (round-trip).

## No-objetivos (por ahora)

- Multi-jugador en tiempo real.
- Tienda o cuentas de usuario.
- Motor 3D.
