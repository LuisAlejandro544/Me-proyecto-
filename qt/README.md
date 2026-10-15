# Qt/C++ port (sin QML) — rebanada 1 en `main`

Puerto nativo con Qt 6 Widgets + `QGraphicsView` (vectores: nítido a todo zoom por diseño).
La app web (`src/`, Tauri, Capacitor) sigue intacta y compilando.

## Compilar y correr (Linux)
```bash
cmake -S qt -B qt/build -G Ninja
cmake --build qt/build
./qt/build/mynovel            # GUI
QT_QPA_PLATFORM=offscreen ./qt/build/smoke  # PNGs de humo (smoke-92.png, smoke-200.png)
```

## Estado
- [x] Modelo (`graph.h/cpp`): preset Sora, `bezierDx` (misma fórmula que TS)
- [x] Nodos (`nodeitem`): 4 tipos, puertos cyan/coral, arrastrables (wires se actualizan)
- [x] Wires (`wireitem`): bezier + glow, anclados a puertos
- [x] Canvas (`canvasview`): pan, wheel-zoom al cursor 35%–200%, grilla de puntos
- [ ] Playtest, modales (drawer), minimap, presets Aoi/blank
- [ ] Cargar proyecto desde JSON (puente con el export web)
- [ ] Guardar/cargar disco, Android (Qt 6.8 soporta Android con el mismo código)
