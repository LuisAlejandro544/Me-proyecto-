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

## ADR-006 — Zoom híbrido: layout en desktop, GPU en táctil
**Contexto:** `scale()` rasterizaba borroso en desktop; CSS `zoom` (nítido) re-maquetaba
todo por frame y era lento en móvil.
**Decisión:** `matchMedia('(pointer: coarse)')` elige: desktop → CSS `zoom` (nítido);
táctil → `transform: scale` (60fps). Pan siempre en `#panLayer`; la matemática no cambia.

## ADR-007 — Solo TypeScript (C++/Qt descartados) [RETIRADO]
**Contexto:** se evaluó port Qt Widgets y luego shell C++ (webview) que hospeda `dist/`.
**Decisión:** retirar ambos (`qt/`, `cpp/` eliminados); el shell C++ solo duplicaba a Tauri
con menos funciones y más mantenimiento. Stack único: TypeScript (Svelte → Tauri + Capacitor).
**Nota técnica rescatada:** `file://` es origen `null` y bloquea CSS/JS por CORS;
por eso el shell servía `dist/` por HTTP local. Tauri/Capacitor usan esquemas propios y no les afecta.
