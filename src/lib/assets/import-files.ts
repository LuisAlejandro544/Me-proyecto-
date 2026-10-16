// Assets: importación por archivos (web + Tauri) (extraído de lib/assets.ts — barrel en lib/assets.ts).
import { ASSET_ACCEPT, MAX_ASSET_BYTES, MAX_ASSET_LABEL } from './types';
import { isTauri } from '../platform';
import type { CustomAsset, ImportResult } from './types';
import { addAssetFiles, getCustomAssets, kindOf, mimeOf, persist } from './store';
export function openSystemFilePicker(accept: string, multiple: boolean): Promise<FileList | File[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    // `capture` NO se fija: así el móvil ofrece "Galería / Cámara / Archivos".
    input.style.display = 'none';
    document.body.appendChild(input);
    let done = false;
    const finish = (value: FileList | null) => {
      if (done) return;
      done = true;
      input.remove();
      window.removeEventListener('focus', onWindowFocus);
      resolve(value && value.length ? value : null);
    };
    const onWindowFocus = () => {
      // Si el usuario cancela, el diálogo se cierra y vuelve el foco sin archivos.
      setTimeout(() => {
        if (!input.files || input.files.length === 0) finish(null);
      }, 600);
    };
    input.onchange = () => finish(input.files);
    input.oncancel = () => finish(null);
    window.addEventListener('focus', onWindowFocus);
    input.click();
    // Salvaguarda por si `oncancel` no existe en el WebView.
    setTimeout(() => {
      if (!done && (!input.files || input.files.length === 0)) {
        // No resolvemos aún: el usuario puede seguir eligiendo.
      }
    }, 30000);
  });
}

export async function importViaTauri(): Promise<ImportResult> {
  const { open } = await import('@tauri-apps/plugin-dialog');
  const { readFile } = await import('@tauri-apps/plugin-fs');
  const picked = await open({
    multiple: true,
    title: 'Importar recursos (imágenes, vídeos o audio)',
    filters: [
      { name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] },
      { name: 'Vídeos', extensions: ['mp4', 'webm', 'mov'] },
      { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }
    ]
  });
  if (!picked) return { agregados: 0, rechazados: [] };
  const paths = Array.isArray(picked) ? picked : [picked];
  const actuales = getCustomAssets();
  const rechazados: string[] = [];
  let agregados = 0;

  for (const p of paths) {
    const name = String(p).split(/[/\\]/).pop() ?? 'recurso';
    try {
      const bytes = await readFile(String(p));
      const bin = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayBuffer);
      if (bin.byteLength > MAX_ASSET_BYTES) {
        rechazados.push(`${name}: supera los ${MAX_ASSET_LABEL}`);
        continue;
      }
      let binary = '';
      const CHUNK = 8192;
      for (let i = 0; i < bin.length; i += CHUNK) {
        binary += String.fromCharCode(...bin.subarray(i, i + CHUNK));
      }
      const mime = mimeOf(name, 'application/octet-stream');
      const kind = kindOf(mime, name);
      if (!kind) {
        rechazados.push(`${name}: tipo no soportado`);
        continue;
      }
      actuales.push({
        id: `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        name: name.replace(/\.[^.]+$/, ''),
        kind,
        mime,
        dataUrl: `data:${mime};base64,${btoa(binary)}`,
        size: bin.byteLength,
        createdAt: Date.now(),
        tags: []
      });
      agregados += 1;
    } catch {
      rechazados.push(`${name}: no se pudo leer`);
    }
  }
  if (agregados > 0) persist(actuales);
  return { agregados, rechazados };
}

export async function pickFilesAsAssets(
  accept: string = ASSET_ACCEPT,
  multiple = true
): Promise<ImportResult> {
  if (isTauri()) {
    try {
      return await importViaTauri();
    } catch {
      // Cae al selector web si el diálogo nativo falla.
    }
  }
  const files = await openSystemFilePicker(accept, multiple);
  if (!files) return { agregados: 0, rechazados: [] };
  return addAssetFiles(Array.from(files));
}
