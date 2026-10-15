# Changelog — formato Keep a Changelog

## [Unreleased]
### Changed
- `src/lib/studio.ts` monolítico → `src/lib/studio/{data,domain,ui}/` + `context.ts` (paridad verificada); chrome a `components/StudioShell.svelte`
### Fixed
- Zoom borroso: layout-zoom (`#panLayer` traslada, `#canvasWorld` con CSS `zoom`); nítido 35%–200%

## [0.1.0] — 2026-10-15
### Added
- Migración del monolito HTML a Web + TypeScript + Svelte (Vite 6)
- Target desktop vía Tauri v2 y móvil vía Capacitor 7
- Plataforma Android (`android/`) + workflow manual de APK debug
- Workflows: `web-check`, `release-web`, `tauri-linux`, `apk-debug`
- Scripts `scripts/` (bootstrap, check, build-all, package-web, release)
- Agente OpenCode (`opencode.yml`) + `AGENTS.md`
