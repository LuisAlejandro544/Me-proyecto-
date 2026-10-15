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

## Compilar local
```bash
flutter build apk --release --split-per-abi  # build/app/outputs/flutter-apk/
flutter build web --release                  # build/web (.html jugable)
```

## Estructura
```
lib/main.dart               # entrada multiplataforma
lib/models/vn_models.dart   # VnProject, VnNode, VnEdge + demo
lib/editor/editor_screen.dart # canvas grid + nodos drag + zoom Fit
lib/player/player_screen.dart # Play Preview jugable
lib/export/html_exporter.dart # genera .html autocontenido
.github/workflows/build-android.yml # CI: analyze+test+APK+Web
```

## Test
```bash
flutter analyze
flutter test
```
