# Probar que todo funciona

## Automático (laptop): `bash scripts/smoke.sh`
1. `npm run build` + `npm run check` (web en verde)
2. Si hay Chromium/Chrome: carga la app headless, cuenta nodos y falla si hay errores de consola

## Manual por target
| Target | Cómo | Esperado |
|---|---|---|
| Web | `npm run dev` → http://localhost:1420 | 4 nodos Sora, wires con glow, zoom 35–200% nítido |
| Tauri | `npm run tauri:dev` | misma UI en ventana nativa |
| APK | Actions → "APK debug Android" → instalar | canvas táctil: pan 1 dedo, pinch-zoom, doble-tap |

## Casos a tocar a mano (todos los targets)
- Cambiar preset Sora ↔ Aoi, crear proyecto en blanco
- Añadir nodo, deshacer, rehacer
- Playtest: Preview → avanzar diálogos → cerrar
- Export Web (.html) y abrir el archivo resultante
- Zoom mín/máx, paneo hasta los bordes, recargar (el estado es de sesión)
- Actualizaciones: cabecera → «Buscar actualizaciones» abre `#updateModal` si hay release nuevo; en Ajustes se ve la versión y se cambia el repo vigilado
