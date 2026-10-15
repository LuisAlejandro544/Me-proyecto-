# Publicar (pensado para hacerse desde el celular)

| Qué | Cómo (GitHub app → Actions → Run) | Resultado |
|---|---|---|
| Web jugable | `Release web` (tag opcional, ej. `v0.2.0`) | Zip en Releases |
| Auto-update (canal de la app) | `Auto-update` o push del tag `v*` (ej. `git tag v0.2.0 && git push origin v0.2.0`) | Zip web de toda la app + zip del código + `update.json` en Releases; la app lo detecta y muestra «Nueva actualización» |
| APK Android | `APK debug Android` | `my-novel-studio-debug.apk` en Releases (`android-debug`) + Artifacts |
| Linux desktop | `Bundle Linux Tauri` | `.deb` + `.AppImage` en Artifacts |

Desde laptop: `bash scripts/release.sh` (sube patch, verifica, empaqueta) y luego tag + push manual.
Versionado: semver en `package.json` + `tauri.conf.json` + `Cargo.toml` (los tres a la par).
