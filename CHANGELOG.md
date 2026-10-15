# Changelog — formato Keep a Changelog

## [Unreleased]
### Added
- Shell nativo C++ en `cpp/` (webview, sin Qt); retira `qt/`
### Added
- Importación de recursos (imágenes/audio) desde galería o administrador de archivos en web, PC (diálogo nativo Tauri) y móvil (galería/cámara Capacitor + respaldo a selector del sistema); módulo `src/lib/assets.ts` con persistencia local
- Editor completo de nodos (`ui/node-editor.ts`): pregunta/diálogo, hablante y color, personaje y expresión, escala/posición y opciones de `choice` (añadir/quitar), con duplicar y eliminar
- Eliminación de nodos: botón 🗑 por nodo + tecla `Supr`/`Retroceso`, borra sus cables y admite Deshacer
- Compartir nivel por URL (`ui/share.ts` + `#btnShareLevel`): modal con selector de permisos (por ahora `Solo jugar`), copiar enlace `#nivel=`, pantallas de carga con progreso y modo invitado a pantalla completa (`shared-play-mode`)
- Docs raíz: `ROADMAP.md`, `STRUCTURE.md`, `AI_CONTEXT.md`, `README_AI.md`; `README.md` y `AGENTS.md` actualizados
### Changed
- `src/lib/studio.ts` monolítico → `src/lib/studio/{data,domain,ui}/` + `context.ts` (paridad verificada); chrome a `components/StudioShell.svelte`
- Interfaz completa traducida al español (cabecera, lienzo, pestañas, paneles, previsualización, exportaciones y presets de ejemplo)
### Fixed
- Zoom borroso: layout-zoom (`#panLayer` traslada, `#canvasWorld` con CSS `zoom`); nítido 35%–200%
- Conectores: puertos re-centrados a `-9px` en el borde, `overflow: visible` y `z-index` 40 (los de `choice` ya no quedan a `-21px` ni se cortan); entrada añadida en `avatar_scene`/`banner_scene` y salida en `character_selector`
- Móvil: cabecera compacta con truncado, pie con scroll horizontal (Personajes visible), modales `92dvh` + safe-area, toast sobre el pie, puertos de 18px en táctil y doble-toque para editar textos

## [0.1.0] — 2026-10-15
### Added
- Migración del monolito HTML a Web + TypeScript + Svelte (Vite 6)
- Target desktop vía Tauri v2 y móvil vía Capacitor 7
- Plataforma Android (`android/`) + workflow manual de APK debug
- Workflows: `web-check`, `release-web`, `tauri-linux`, `apk-debug`
- Scripts `scripts/` (bootstrap, check, build-all, package-web, release)
- Agente OpenCode (`opencode.yml`) + `AGENTS.md`
