// Assets: persistencia local y altas (extraído de lib/assets.ts — barrel en lib/assets.ts).
import { MAX_ASSET_BYTES, MAX_ASSET_LABEL, STORAGE_KEY, normalizeTags } from './types';
import type { CustomAsset, CustomAssetKind } from './types';
import type { ImportResult } from './types';
// Caché en memoria de la sesión: evita perder recursos si localStorage
// está lleno (vídeos/audios grandes como dataURL superan la cuota de ~5MB).
let memoryCache: CustomAsset[] | null = null;
let quotaWarned = false;

function safeParse(raw: string | null): CustomAsset[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (a) => a && typeof a.id === 'string' && typeof a.dataUrl === 'string'
      )
      .map((a) => ({ ...a, tags: normalizeTags(a.tags) }));
  } catch {
    return [];
  }
}

export function getCustomAssets(): CustomAsset[] {
  // Caché en memoria: si localStorage está lleno/corrupto, los recursos
  // añadidos en esta sesión siguen apareciendo y la pestaña sigue abriendo.
  if (memoryCache) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [...memoryCache];
      const parsed = safeParse(raw);
      // Si lo persistido coincide en tamaño, es la fuente de verdad;
      // si no (cuota excedida a mitad), preferimos la memoria (más nueva).
      if (parsed.length >= memoryCache.length) {
        memoryCache = parsed;
        return [...parsed];
      }
      return [...memoryCache];
    } catch {
      return [...memoryCache];
    }
  }
  try {
    const parsed = safeParse(localStorage.getItem(STORAGE_KEY));
    memoryCache = parsed;
    return [...parsed];
  } catch {
    return memoryCache ? [...memoryCache] : [];
  }
}

export function persist(assets: CustomAsset[]): void {
  memoryCache = [...assets];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch (err) {
    // Cuota excedida: avisamos una vez por sesión pero NO perdemos nada en memoria.
    try {
      const name = (err as DOMException)?.name ?? '';
      if (!quotaWarned && (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        quotaWarned = true;
        queueMicrotask(() => {
          try {
            window.dispatchEvent(new CustomEvent('vn:assets-quota'));
          } catch { /* noop */ }
        });
      }
    } catch { /* noop */ }
  }
  try {
    window.dispatchEvent(new CustomEvent('vn:assets-changed'));
  } catch {
    /* noop */
  }
}

export function kindOf(mime: string, name: string): CustomAssetKind | null {
  if (mime.startsWith('image/')) return 'imagen';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return 'imagen';
  if (['mp4', 'webm', 'mov', 'mkv'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return 'audio';
  return null;
}

export function mimeOf(name: string, fallback: string): string {
  if (fallback && fallback !== 'application/octet-stream') return fallback;
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4'
  };
  return map[ext] ?? fallback;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}


export async function addAssetFiles(files: FileList | File[]): Promise<ImportResult> {
  const list = Array.from(files ?? []);
  const actuales = getCustomAssets();
  const rechazados: string[] = [];
  let agregados = 0;

  for (const file of list) {
    const kind = kindOf(file.type, file.name);
    if (!kind) {
      rechazados.push(`${file.name}: tipo no soportado (usa imagen, vídeo o audio)`);
      continue;
    }
    if (file.size > MAX_ASSET_BYTES) {
      rechazados.push(`${file.name}: supera los ${MAX_ASSET_LABEL}`);
      continue;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      actuales.push({
        id: `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name.replace(/\.[^.]+$/, '') || 'Recurso importado',
        kind,
        mime: mimeOf(file.name, file.type),
        dataUrl,
        size: file.size,
        createdAt: Date.now(),
        tags: []
      });
      agregados += 1;
    } catch {
      rechazados.push(`${file.name}: no se pudo leer`);
    }
  }

  if (agregados > 0) persist(actuales);
  return { agregados, rechazados };
}

export function removeCustomAsset(id: string): void {
  persist(getCustomAssets().filter((a) => a.id !== id));
}

/** Renombra un recurso de la carpeta sin tocar su contenido. */
export function renameCustomAsset(id: string, newName: string): boolean {
  const clean = (newName ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);
  if (!clean) return false;
  const actuales = getCustomAssets();
  const target = actuales.find((a) => a.id === id);
  if (!target) return false;
  target.name = clean;
  persist(actuales);
  return true;
}

export function assetSizeLabel(size: number): string {
  if (!size || size <= 0) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function findCustomAsset(id: string | undefined | null): CustomAsset | undefined {
  if (!id) return undefined;
  return getCustomAssets().find((a) => a.id === id);
}

export function saveCustomAssetFromDataUrl(
  dataUrl: string,
  name: string,
  tags: string[] = []
): CustomAsset | null {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return null;
  const clean = (name ?? '').trim().replace(/\s+/g, ' ').slice(0, 60) || 'Composición';
  const actuales = getCustomAssets();
  const asset: CustomAsset = {
    id: `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: clean,
    kind: 'imagen',
    mime: 'image/png',
    dataUrl,
    size: Math.round(dataUrl.length * 0.75),
    createdAt: Date.now(),
    tags: normalizeTags(tags)
  };
  actuales.push(asset);
  persist(actuales);
  return asset;
}
