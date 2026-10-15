# Publicar (pensado para hacerse desde el celular)

| Qué | Cómo (GitHub app → Actions → Run) | Resultado |
|---|---|---|
| Web jugable | `Release web` (tag opcional, ej. `v0.2.0`) | Zip en Releases |
| APK Android | `APK debug Android` | `my-novel-studio-debug.apk` en Releases (`android-debug`) + Artifacts |
| Linux desktop | `Bundle Linux Tauri` | `.deb` + `.AppImage` en Artifacts |

Desde laptop: `bash scripts/release.sh` (sube patch, verifica, empaqueta) y luego tag + push manual.
Versionado: semver en `package.json` + `tauri.conf.json` + `Cargo.toml` (los tres a la par).
