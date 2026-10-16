// @ts-nocheck
// Compilador: guardado y paquetes Win/Linux (extraído de ui/compile.ts — ver barrel ui/compile.ts).
import { ctx } from '../../context';
import { playSynthSfx } from '../../domain/audio';
import { showToast } from '../toast';
import { sanitizeFileStem } from './types';
import { validateStory } from './validate';
import { buildHistoria } from './historia';
import { buildStandaloneHtml, formatBytes } from './standalone';
/** Guardado multiplataforma: Tauri (diálogo nativo) → Capacitor (Share) → web (descarga). */
export async function saveTextFile(filename: string, content: string, mime = 'text/plain'): Promise<boolean> {
  // Tauri (PC): diálogo nativo real.
  try {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const ext = (filename.split('.').pop() || '').toLowerCase();
      const path = await save({ defaultPath: filename, filters: [{ name: 'Novela', extensions: [ext || '*'] }] });
      if (!path) return false;
      await writeTextFile(path, content);
      return true;
    }
  } catch {}
  // Capacitor (móvil): guarda en caché y abre el Share sheet.
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (cap?.isNativePlatform?.()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      const data = btoa(unescape(encodeURIComponent(content)));
      const res = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache });
      await Share.share({ title: filename, url: res.uri, dialogTitle: 'Compartir exportación' });
      return true;
    }
  } catch {}
  try {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Exporta la novela jugable .html (validación + guardado nativo). */
export async function exportStandaloneHtmlFile(): Promise<boolean> {
  playSynthSfx('connect');
  const issues = validateStory();
  if (issues.some((i) => i.level === 'error')) {
    showToast(`No se puede compilar: ${issues.find((i) => i.level === 'error').msg}`);
    return false;
  }
  const stem = sanitizeFileStem(ctx.state.projectName);
  const html = buildStandaloneHtml();
  const ok = await saveTextFile(`${stem}_Web.html`, html, 'text/html');
  try {
    (window as unknown as { __lastStandaloneHtml?: string }).__lastStandaloneHtml = html;
  } catch {}
  showToast(ok ? `¡Novela web autónoma (.html) exportada! (${formatBytes(new Blob([html]).size)})` : 'No se pudo guardar el .html');
  return ok;
}

/** Exporta el formato portable historia.vn.json. */
export async function exportHistoriaJson(): Promise<boolean> {
  playSynthSfx('connect');
  const stem = sanitizeFileStem(ctx.state.projectName);
  const json = JSON.stringify(buildHistoria(), null, 2);
  const ok = await saveTextFile(`${stem}.vn.json`, json, 'application/json');
  showToast(ok ? 'Historia portable (.vn.json) exportada 📦' : 'No se pudo guardar el .vn.json');
  return ok;
}

function windowsBatFor(htmlFile: string, project: string): string {
  return `@echo off\r\nrem ${project} — lanzador Windows (doble clic para jugar)\r\nrem Este .bat abre la novela jugable en tu navegador predeterminado.\r\nstart "" "%~dp0${htmlFile}"\r\n`;
}

function linuxShFor(htmlFile: string, project: string): string {
  return `#!/bin/sh\n# ${project} — lanzador Linux (dale permiso de ejecución una vez: chmod +x)\nHERE="$(dirname "$0")"\nif command -v xdg-open >/dev/null 2>&1; then\n  xdg-open "$HERE/${htmlFile}" &\nelse\n  echo "Abre este archivo en tu navegador: $HERE/${htmlFile}"\nfi\n`;
}

function linuxDesktopFor(shFile: string, project: string): string {
  const safe = project.replace(/;/g, ',');
  return `[Desktop Entry]\nType=Application\nName=${safe}\nComment=Novela visual jugable (abre el lanzador .sh)\nExec=sh -c 'xdg-open "$(dirname %k)" &'\nTerminal=false\nCategories=Game;\n`;
}

/**
 * Paquete Windows FUNCIONAL: descarga la novela .html jugable + su lanzador .bat.
 * (Antes solo se descargaba el .bat sin el .html: no funcionaba.)
 * El .exe nativo real se obtiene con el workflow manual «Bundle escritorio».
 */
export async function exportWindowsPackage(status?: (msg: string) => void): Promise<boolean> {
  playSynthSfx('connect');
  const issues = validateStory();
  if (issues.some((i) => i.level === 'error')) {
    showToast(`No se puede compilar: ${issues.find((i) => i.level === 'error').msg}`);
    return false;
  }
  const stem = sanitizeFileStem(ctx.state.projectName);
  const htmlFile = `${stem}_Web.html`;
  const batFile = `Iniciar_${stem}.bat`;
  status?.('Generando novela jugable…');
  await sleep(120);
  const html = buildStandaloneHtml();
  try {
    (window as unknown as { __lastStandaloneHtml?: string }).__lastStandaloneHtml = html;
  } catch {}
  status?.('Guardando .html jugable…');
  const okHtml = await saveTextFile(htmlFile, html, 'text/html');
  if (!okHtml) return false;
  await sleep(350); // deja que el navegador registre la primera descarga
  status?.('Guardando lanzador de Windows…');
  const okBat = await saveTextFile(batFile, windowsBatFor(htmlFile, ctx.state.projectName || 'Mi Novela'), 'application/bat');
  showToast(
    okBat
      ? 'Paquete Windows listo: abre el .bat para jugar 🎮 (el .exe nativo sale del workflow «Bundle escritorio»)'
      : 'Se descargó el .html; el lanzador .bat no se pudo guardar'
  );
  return okHtml && okBat;
}

/**
 * Paquete Linux FUNCIONAL: .html jugable + lanzador .sh ejecutable + acceso .desktop.
 * El .AppImage/.deb nativo real se obtiene con el workflow manual «Bundle escritorio».
 */
export async function exportLinuxPackage(status?: (msg: string) => void): Promise<boolean> {
  playSynthSfx('connect');
  const issues = validateStory();
  if (issues.some((i) => i.level === 'error')) {
    showToast(`No se puede compilar: ${issues.find((i) => i.level === 'error').msg}`);
    return false;
  }
  const stem = sanitizeFileStem(ctx.state.projectName);
  const project = ctx.state.projectName || 'Mi Novela';
  const htmlFile = `${stem}_Web.html`;
  const shFile = `jugar-${stem.toLowerCase()}.sh`;
  const desktopFile = `${stem.toLowerCase()}.desktop`;
  status?.('Generando novela jugable…');
  await sleep(120);
  const html = buildStandaloneHtml();
  try {
    (window as unknown as { __lastStandaloneHtml?: string }).__lastStandaloneHtml = html;
  } catch {}
  status?.('Guardando .html jugable…');
  if (!(await saveTextFile(htmlFile, html, 'text/html'))) return false;
  await sleep(350);
  status?.('Guardando lanzador Linux (.sh)…');
  if (!(await saveTextFile(shFile, linuxShFor(htmlFile, project), 'text/x-shellscript'))) return false;
  await sleep(350);
  status?.('Guardando acceso directo (.desktop)…');
  const okDesk = await saveTextFile(desktopFile, linuxDesktopFor(shFile, project), 'text/plain');
  showToast(
    okDesk
      ? `Paquete Linux listo 🐧: ejecuta «chmod +x ${shFile}» y ábrelo (el .AppImage/.deb sale del workflow «Bundle escritorio»)`
      : 'Se descargó el .html y el .sh; el .desktop no se pudo guardar'
  );
  return okDesk;
}
