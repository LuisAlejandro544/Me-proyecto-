# Contribuir

1. Crea un issue (plantillas 🐞/✨) o comenta `/oc <pedido>` para que OpenCode lo trabaje.
2. Trabaja en rama (`feat/...`, `fix/...`, `spike/...`); nunca directo a `main` salvo fixes triviales.
3. Antes del PR: `bash scripts/check.sh` (build + svelte-check en verde).
4. PR con la plantilla: qué cambia + cómo se verificó.
5. Respeta `.gitignore` (nada de `node_modules/`, `dist/`, lockfiles ni iconos regenerables).
6. Actualiza `CHANGELOG.md` (`[Unreleased]`) y docs si cambia comportamiento.
