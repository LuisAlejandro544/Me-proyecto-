# Manga Maker / My Novel

Editor visual por nodos estilo la referencia: `Start → Sprite: Yui → Dialogue-01 → Choices → 2 finales`. Misma UI en Android y PC (Flutter).

## Requisitos
- Flutter 3.47+ / Dart 3.13+
- Android SDK + Java 17 (solo para APK local; en CI lo pone GitHub)

## Uso rápido (sin PC, desde el celular de tu amigo)
1. GitHub > repo > **Actions > Build Android APK > Run workflow** (o haz push a `main`).
2. Al terminar, descarga **Artifacts > app-release-apks**.
3. Instala el APK según tu CPU:
   - `app-arm64-v8a-release.apk` (móviles nuevos 64 bits)
   - `app-armeabi-v7a-release.apk` (móviles viejos 32 bits)
4.Ways: instalador directo o súbelo a Uptodown (no Google Play).

## Correr local
```bash
flutter pub get
flutter run -d linux     # PC Linux
flutter run -d windows   # PC Windows
flutter run -d android   # Android
flutter run -d chrome    # Web preview
```

## Compilar local (o un script para todo)
```bash
bash scripts/build.sh --all      # APK + Linux + Windows + Web (salta lo que tu OS no soporte)
bash scripts/build.sh --apk      # build/app/outputs/flutter-apk/ (arm64 + arm32)
flutter build web --release      # build/web (.html jugable)
```

## CI (sin PC, lo corre GitHub)
Workflow **Build APK + Linux + Windows**: `check` (analyze+test) y luego en
paralelo `android` (APK split + Web), `linux` (bundle) y `windows` (Release).
Artefactos: `app-release-apks`, `web-build`, `linux-bundle`, `windows-release`.
Se dispara con push a `main` o manual en Actions > Run workflow.

## Estructura (ver `docs/ARCHITECTURE.md`)
```
lib/main.dart                          # bootstrap mínimo
lib/app/app.dart                       # MaterialApp + tema
lib/core/theme/app_theme.dart          # AppColors (cero hex en UI)
lib/core/perf/fps_chip.dart            # medidor fps (1 rebuild/seg)
lib/features/graph/graph.dart          # barrel del feature
lib/features/graph/models/             # datos puros, sin Flutter
lib/features/graph/state/             # GraphController (índice O(1))
lib/features/graph/editor/            # editor + nodos + painters
lib/features/graph/player/            # Play Preview
lib/features/graph/export/            # HTML autocontenido
scripts/build.sh                       # compila APK/Linux/Windows/Web
.github/workflows/build-android.yml    # CI: check + android + linux + windows
```

## Test
```bash
flutter analyze
flutter test
```
