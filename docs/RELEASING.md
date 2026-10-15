# Publicar (pensado para hacerse desde el celular)

| Qué | Cómo (GitHub app → Actions → Run) | Resultado |
|---|---|---|
| Web jugable | `Release web` (tag opcional, ej. `v0.2.0`) | Zip en Releases |
| Auto-update (canal de la app) | Publicar un release (GitHub → Releases → Draft new release → Publish, ej. `v0.2.0`) o `Auto-update` manual (Actions → Run, tag opcional) | Zip web de toda la app + zip del código + `update.json` en ese mismo Release; la app lo detecta y muestra «Nueva actualización» |
| APK Android | `APK debug Android` | `my-novel-studio-debug.apk` en Releases (`android-debug`) + Artifacts |
| Linux desktop | `Bundle Linux Tauri` | `.deb` + `.AppImage` en Artifacts |

Disparadores: `Auto-update` SOLO corre al publicar un release o manual
(`release: published` + `workflow_dispatch`). Nunca por push/commits,
pull requests ni ningún otro evento (tampoco por crear el tag `v*` sin
publicar el release).

Desde laptop: `bash scripts/release.sh` (sube patch, verifica, empaqueta) y luego crea + publica el release en GitHub.
Versionado: semver en `package.json` + `tauri.conf.json` + `Cargo.toml` (los tres a la par).
