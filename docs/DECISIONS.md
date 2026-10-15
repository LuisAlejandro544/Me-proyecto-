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

## ADR-006 — Zoom por GPU (`transform: scale`), no por layout
**Contexto:** primero `scale()` rasterizaba como bitmap (+ `backdrop-filter`) y se
veía borroso; se pasó a CSS `zoom` (nítido) pero re-maquetaba todos los nodos por
frame y reconstruía cables + minimapa en cada `pointermove`: lento en móvil.
**Decisión:** `#panLayer` traslada y `#canvasWorld` escala con `transform` (GPU,
sin re-layout). Pan/pinch/zoom solo tocan el compositor (un rAF, rect cacheado);
los cables escalan solos y solo se tocan en drag (`updateWirePaths`) o cambio de
grafo (`renderWires`); durante el gesto `body.vn-gesturing` apaga blur/glow y en
táctil no se usan filtros gaussianos. La matemática
(`screenToWorld`, `zoomAtPoint`, drag ÷ zoom) no cambió.
**Consecuencia:** nítido de 35% a 200% y 60fps en móvil; verificado con build + check.

## ADR-007 — Solo TypeScript (C++/Qt descartados) [RETIRADO]
**Contexto:** se evaluó port Qt Widgets y luego shell C++ (webview) que hospeda `dist/`.
**Decisión:** retirar ambos (`qt/`, `cpp/` eliminados); el shell C++ solo duplicaba a Tauri
con menos funciones y más mantenimiento. Stack único: TypeScript (Svelte → Tauri + Capacitor).
**Nota técnica rescatada:** `file://` es origen `null` y bloquea CSS/JS por CORS;
por eso el shell servía `dist/` por HTTP local. Tauri/Capacitor usan esquemas propios y no les afecta.
