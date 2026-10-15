# Decisiones (ADRs breves)

## ADR-001 — Un solo código web para desktop y móvil
**Contexto:** veníamos de Flutter; se pidió portar el estudio de novela visual.
**Decisión:** Vite + Svelte + TS como única base; Tauri v2 para desktop, Capacitor 7 para móvil.
**Consecuencia:** cero rewrites por plataforma; el export `.html` existente se reutiliza en los tres targets.

## ADR-002 — Port verbatim antes que rewrite
**Decisión:** portar el monolito tal cual (`studio.ts` + ids intactos) con paridad 100%, y refactorizar por componentes después.
**Consecuencia:** `studio.ts` carga con `// @ts-nocheck` hasta completar la migración a stores Svelte.

## ADR-003 — APK debug manual desde CI
**Decisión:** `android/` commiteado; workflow `apk-debug.yml` manual publica en el tag rodante `android-debug`.
**Consecuencia:** Luis instala desde el celular sin PC; el release se sobrescribe en cada ejecución.

## ADR-004 — Sin lockfiles en git**Decisión:** `package-lock.json` y `Cargo.lock` ignorados; CI resuelve en cada run.
**Consecuencia:** diffs limpios a cambio de resolución no pinnada (aceptable en este tamaño).

## ADR-005 — Modularización por dominios (sin rewrite)
**Decisión:** partir `studio.ts` (1650 líneas) en `lib/studio/{data,domain,ui}/` + `context.ts` como único estado mutable, con extracción mecánica verificada (build + check + captura headless idéntica).
**Consecuencia:** cada módulo tiene una sola razón de cambio; `context.ts` es el seam para migrar a stores Svelte por slices (Fase 2: componentes por tipo de nodo).

## ADR-006 — Zoom por layout (CSS `zoom`), no por `scale()`
**Contexto:** el `scale()` CSS rasterizaba los nodos como bitmap (+ `backdrop-filter`) y el texto se veía borroso al acercar.
**Decisión:** `#panLayer` solo traslada (px de pantalla); `#canvasWorld` usa `zoom: <nivel>` para re-maquetar nítido. La matemática existente (`screenToWorld`, `zoomAtPoint`, drag ÷ zoom) no cambió.
**Consecuencia:** texto y vectores nítidos de 35% a 200%; verificado con capturas headless.

## ADR-007 — Shell C++ sin Qt, UI 100% web
**Contexto:** se evaluó portar la UI a Qt Widgets y se descartó (curva + framework extra).
**Decisión:** binario C++ (`cpp/`, librería `webview`) que hospeda `dist/`; cero rewrite de UI.
**Consecuencia:** los bindings nativos (guardar archivo, etc.) se añaden en C++ sin tocar Svelte.
