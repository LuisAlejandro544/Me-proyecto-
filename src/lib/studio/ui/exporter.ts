// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
// El generador real vive en ui/compile.ts (fuente única). Aquí quedan
// compat wrappers para el wiring existente: la exportación .html es completa
// y la de .exe abre el modal Compilar (paquete funcional, ya no el .bat solo).
import { openCompileModal, exportStandaloneHtmlFile } from './compile';

export function exportStandaloneHtml() {
  return exportStandaloneHtmlFile();
}
export function openExeExportModal() {
  return openCompileModal('windows');
}
