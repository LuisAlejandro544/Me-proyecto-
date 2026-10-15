# Roadmap — Visual Novel Node Studio

> Estado a 2026-10-15. Hecho reciente: bloque de vídeo 🎬 + complemento de sonido 🔊
> (carpeta con galería de vídeos y audios), reproductor de prueba en horizontal 16:9,
> enlaces compartibles (adiós `localhost` + `.html` jugable) y canal de
> auto-actualizaciones (workflow `Auto-update` solo en release publicado o manual
> + pantalla «Nueva actualización» en la app).

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
- [ ] Pruebas visuales del modo invitado en Android (WebView) y iOS (Safari).

## Siguiente (v0.3) — niveles y permisos

- [ ] Más permisos del enlace: `ver` (solo mirar), `comentar`, `editar` (con copia).
- [ ] Niveles cortos con código (`/j/AbC123`) guardados en backend o archivo, para
  URLs cortas en lugar de base64url gigante.
- [ ] Caducidad y revocación de enlaces.
- [ ] Miniaturas de nodos en el editor (vista previa del sprite).
- [ ] Validación del grafo: nodos sin salida, opciones sin cable, personajes rotos.

## Después (v0.4+) — editor y plataformas

- [ ] Refactor a componentes Svelte (`TopBar`, `Canvas`, `NodeCard`, `PlaytestModal`)
  con stores en vez de `ctx` mutable + `// @ts-nocheck`.
- [ ] Historial por nodo y portapapeles (copiar/pegar nodos con Ctrl+C/V).
- [x] Audio por escena (campo opcional) y nodo de sonido; pendiente: transiciones de fondo.
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
