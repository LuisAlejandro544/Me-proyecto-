# Publicar (pensado para hacerse desde el celular)

| Qué | Cómo (GitHub app → Actions → Run) | Resultado |
|---|---|---|
| Web jugable | `Release web` (tag opcional, ej. `v0.2.0`) | Zip en Releases |
| Auto-update (canal de la app) | Publicar un release (GitHub → Releases → Draft new release → Publish, ej. `v0.2.0`) o `Auto-update` manual (Actions → Run, tag opcional) | Zip web portable + zip del código + `update.json`/`latest.json` + `SHA256SUMS.txt` en ese mismo Release (versión = tag); la app lo detecta y muestra «Nueva actualización». Si subes instaladores nativos al release (.exe/.msi, .AppImage/.deb, .dmg, .apk), la app los descarga y abre para actualizar de verdad |
| APK Android | `APK debug Android` | `my-novel-studio-debug.apk` en Releases (`android-debug`) + Artifacts |
| Linux desktop | `Bundle Linux Tauri` | `.deb` + `.AppImage` en Artifacts |

Disparadores: `Auto-update` SOLO corre al publicar un release o manual
(`release: published` + `workflow_dispatch`). Nunca por push/commits,
pull requests ni ningún otro evento (tampoco por crear el tag `v*` sin
publicar el release).

Desde laptop: `bash scripts/release.sh` (sube patch, verifica, empaqueta) y luego crea + publica el release en GitHub.
Versionado: semver en `package.json` + `tauri.conf.json` + `Cargo.toml` (los tres a la par).

## Cómo actualiza cada plataforma (sin fingir)
- Escritorio (Tauri): el botón descarga el instalador de tu sistema (`.exe`/`.msi` en Windows, `.AppImage`/`.deb` en Linux, `.dmg` en macOS) y lo **abre** con el plugin `opener` para que completes la instalación. Sin instalador en el release, el `.zip` es solo el portable (la app lo dice, no finge actualizar).
- Android (Capacitor): descarga el `.apk` y abre el instalador del sistema.
- Web: la actualización real es **recargar** (el botón limpia caché + service workers y recarga). Descargar el `.zip` no cambia la pestaña.

## Updater silencioso firmado (roadmap, no activo)
Tauri v2 trae `tauri-plugin-updater` con firma (`TAURI_SIGNING_PRIVATE_KEY` + `pubkey` en `tauri.conf.json` + `latest.json` con firmas `.sig`). No está activado porque aún no hay claves generadas ni CI que firme los bundles. Cuando se quiera: generar claves (`tauri signer generate`), guardar la privada como secreto, compilar bundles con `--bundles` + firma en CI, publicar `latest.json` con URLs+firmas y cambiar el botón a `check()`/`downloadAndInstall()`. Hasta entonces, el flujo instalador-descargado es el canal oficial.
