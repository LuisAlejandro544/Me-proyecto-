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

## ADR-004 — Sin lockfiles en git
**Decisión:** `package-lock.json` y `Cargo.lock` ignorados; CI resuelve en cada run.
**Consecuencia:** diffs limpios a cambio de resolución no pinnada (aceptable en este tamaño).
