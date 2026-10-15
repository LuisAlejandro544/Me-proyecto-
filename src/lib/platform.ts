// Unified export target: Web + Tauri (desktop .exe) + Capacitor (mobile).
// The legacy canvas already downloads .html via anchor. These helpers give
// native save/share when running inside Tauri or Capacitor.

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export function isCapacitor(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
      ?.isNativePlatform === 'function' &&
    (window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform()
  );
}

function currentStandaloneHtml(): string {
  // Ask legacy studio for state, then reuse its exporter if present.
  const w = window as unknown as {
    __studio?: { getStudioState?: () => unknown };
    __lastStandaloneHtml?: string;
  };
  if (w.__lastStandaloneHtml) return w.__lastStandaloneHtml;
  const st = w.__studio?.getStudioState?.();
  return `<!doctype html><html><body><pre>${JSON.stringify(st ?? {}, null, 2)
    .replace(/</g, '&lt;')}</pre></body></html>`;
}

export async function saveHtmlExport(filename = 'my-novel-export.html'): Promise<void> {
  const html = currentStandaloneHtml();

  if (isTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const path = await save({ defaultPath: filename, filters: [{ name: 'HTML', extensions: ['html'] }] });
    if (path) await writeTextFile(path, html);
    return;
  }

  if (isCapacitor()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const res = await Filesystem.writeFile({ path: filename, data: btoa(unescape(encodeURIComponent(html))), directory: Directory.Cache });
    await Share.share({ title: 'Exportar web (.html)', url: res.uri, dialogTitle: 'Compartir exportación' });
    return;
  }

  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
