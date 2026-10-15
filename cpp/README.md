# C++ shell (sin Qt) — hospeda la UI web existente

Binario nativo C++ que abre `dist/` en un WebView del sistema
(WebKitGTK en Linux, WebView2 en Windows, WKWebView en macOS).
**Los elementos de UI viven en `src/` (Svelte)** — aquí solo el contenedor
más bindings nativos (`window.appVersion()` de ejemplo).

## Compilar y correr (Linux)
```bash
cmake -S cpp -B cpp/build -G Ninja   # descarga webview vía FetchContent
cmake --build cpp/build
./cpp/build/vnstudio                  # sirve dist/ por HTTP local y lo abre
QT_QPA_PLATFORM=offscreen ./cpp/build/testserve  # verifica el servidor embebido
```

## Siguiente
- Binding `saveHtml(html, nombre)` en C++ (diálogo GTK + `std::ofstream`) para
  reemplazar la descarga del navegador en `platform.ts`.
- Empaquetado: `cpack -G DEB` / AppImage.
