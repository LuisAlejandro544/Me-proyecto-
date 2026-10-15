// Gestión unificada de assets personalizados: Web + Tauri (PC) + Capacitor (móvil).
// - Web: <input type="file" accept="image/*,video/*,audio/*"> (abre galería / administrador de archivos).
// - Tauri (PC): diálogo nativo `open` + lectura binaria con plugin-fs.
// - Capacitor (móvil): plugin Camera.pickImages (galería de fotos) con respaldo a
//   <input type="file">, que en Android/iOS también abre la galería de vídeos
//   o el administrador de archivos según el `accept`.
//
// Los assets se guardan como dataURL y persisten en localStorage para que el
// proyecto, la previsualización y la exportación .html los resuelvan sin red.
// Nota: los vídeos pesan mucho; si el nivel supera ~8 KB de URL compartida se
// avisa en el modal de compartir (mejor enviar el .html exportado).

import { isCapacitor, isTauri } from './platform';
import { CHARACTER_ASSETS } from './studio/data/assets';

export type CustomAssetKind = 'imagen' | 'audio' | 'video';

export interface CustomAsset {
  id: string;
  name: string;
  kind: CustomAssetKind;
  mime: string;
  dataUrl: string;
  size: number;
  createdAt: number;
  /** Etiquetas libres para organizar la carpeta (minúsculas, sin espacios). */
  tags: string[];
}

const STORAGE_KEY = 'vn_custom_assets_v1';
export const MAX_ASSET_BYTES = 30 * 1024 * 1024;
export const MAX_ASSET_LABEL = '30 MB';
export const ASSET_ACCEPT =
  'image/*,video/*,audio/*,.png,.jpg,.jpeg,.webp,.gif,.mp4,.webm,.mov,.mp3,.wav,.ogg,.m4a';
export const IMAGE_ACCEPT = 'image/*,.png,.jpg,.jpeg,.webp,.gif';
export const VIDEO_ACCEPT = 'video/*,.mp4,.webm,.mov';
export const AUDIO_ACCEPT = 'audio/*,.mp3,.wav,.ogg,.m4a';

/** Normaliza etiquetas: minúsculas, sin espacios, máx 24 chars, máx 12 por asset. */
export function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const t of raw) {
    const clean = String(t ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9áéíóúñü_-]/gi, '')
      .slice(0, 24);
    if (!clean || out.includes(clean)) continue;
    out.push(clean);
    if (out.length >= 12) break;
  }
  return out;
}

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
  try {
    return safeParse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function persist(assets: CustomAsset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch {
    // localStorage lleno o no disponible: se sigue en memoria en esta sesión.
  }
  try {
    window.dispatchEvent(new CustomEvent('vn:assets-changed'));
  } catch {
    /* noop */
  }
}

function kindOf(mime: string, name: string): CustomAssetKind | null {
  if (mime.startsWith('image/')) return 'imagen';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return 'imagen';
  if (['mp4', 'webm', 'mov', 'mkv'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return 'audio';
  return null;
}

function mimeOf(name: string, fallback: string): string {
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

export interface ImportResult {
  agregados: number;
  rechazados: string[];
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

/** Catálogo combinado: personajes incluidos + imágenes importadas por el usuario. */
export function getCharacterCatalog(): Record<string, any> {
  const customs: Record<string, any> = {};
  for (const a of getCustomAssets()) {
    if (a.kind !== 'imagen') continue;
    customs[a.id] = {
      id: a.id,
      name: a.name,
      color: '#22d3ee',
      avatar: a.dataUrl,
      banner: a.dataUrl,
      expressions: ['Personalizado'],
      custom: true
    };
  }
  return { ...(CHARACTER_ASSETS as Record<string, any>), ...customs };
}

/** Resuelve el personaje de un nodo, con respaldo a Sora si el recurso se eliminó. */
export function resolveCharacter(id: string | undefined | null): any {
  const catalog = getCharacterCatalog();
  return catalog[id ?? ''] ?? catalog.sora;
}

/** Abre el selector del sistema: galería o administrador de archivos según plataforma. */
function openSystemFilePicker(accept: string, multiple: boolean): Promise<FileList | File[] | null> {
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

async function importViaTauri(): Promise<ImportResult> {
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

async function importViaCapacitorGallery(limit = 10): Promise<ImportResult | null> {
  try {
    const { Camera } = await import('@capacitor/camera');
    const res = await Camera.pickImages({ quality: 90, limit });
    const photos = res.photos ?? [];
    if (photos.length === 0) return { agregados: 0, rechazados: [] };
    const actuales = getCustomAssets();
    let agregados = 0;
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      try {
        const anyPhoto = photo as unknown as { base64String?: string; webPath?: string; format?: string };
        let dataUrl: string | null = null;
        if (anyPhoto.base64String) {
          dataUrl = `data:${anyPhoto.format === 'jpeg' ? 'image/jpeg' : `image/${anyPhoto.format ?? 'jpeg'}`};base64,${anyPhoto.base64String}`;
        } else if (anyPhoto.webPath) {
          const resp = await fetch(photo.webPath);
          const blob = await resp.blob();
          if (blob.size > MAX_ASSET_BYTES) continue;
          dataUrl = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result));
            r.onerror = () => reject(new Error('read'));
            r.readAsDataURL(blob);
          });
        }
        if (!dataUrl) continue;
        actuales.push({
          id: `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          name: `Foto de galería ${actuales.length + 1}`,
          kind: 'imagen',
          mime: 'image/jpeg',
          dataUrl,
          size: 0,
          createdAt: Date.now(),
          tags: []
        });
        agregados += 1;
      } catch {
        /* salta fotos ilegibles */
      }
    }
    if (agregados > 0) persist(actuales);
    return { agregados, rechazados: [] };
  } catch {
    // Plugin Camera no disponible: usar selector del sistema.
    return null;
  }
}

/** Galería nativa del móvil (Camera.pickImages) con respaldo al selector web. */
export async function pickGalleryImages(limit = 10): Promise<ImportResult> {
  if (isCapacitor()) {
    const gallery = await importViaCapacitorGallery(limit);
    if (gallery) return gallery;
  }
  const files = await openSystemFilePicker(IMAGE_ACCEPT, true);
  if (!files) return { agregados: 0, rechazados: [] };
  return addAssetFiles(Array.from(files));
}

/** Galería de vídeos: en móvil abre el selector del sistema filtrado a vídeo. */
export async function pickGalleryVideos(): Promise<ImportResult> {
  const files = await openSystemFilePicker(VIDEO_ACCEPT, true);
  if (!files) return { agregados: 0, rechazados: [] };
  return addAssetFiles(Array.from(files));
}

/** Selector de audio: administrador de archivos filtrado a audio. */
export async function pickAudioFiles(): Promise<ImportResult> {
  return pickFilesAsAssets(AUDIO_ACCEPT, true);
}

/** Administrador de archivos del sistema (en móvil abre Archivos, no solo galería). */
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

/**
 * Punto de entrada multiplataforma: abre la galería (móvil) o el
 * administrador de archivos (web/PC) y guarda lo elegido como dataURL.
 * En móvil con imágenes se prefiere la galería nativa; para audio o
 * para «Archivos» usa siempre el selector del sistema.
 */
export async function pickAssetsFromDevice(options?: {
  accept?: string;
  multiple?: boolean;
  source?: 'auto' | 'gallery' | 'files';
}): Promise<ImportResult> {
  const accept = options?.accept ?? ASSET_ACCEPT;
  const multiple = options?.multiple ?? true;
  const source = options?.source ?? 'auto';

  if (source === 'gallery') return pickGalleryImages();
  if (source === 'files') return pickFilesAsAssets(accept, multiple);

  if (isTauri()) {
    try {
      return await importViaTauri();
    } catch {
      // Cae al selector web si el diálogo nativo falla.
    }
  }

  if (isCapacitor() && accept.includes('image') && !accept.includes('audio')) {
    const gallery = await importViaCapacitorGallery();
    if (gallery && (gallery.agregados > 0 || gallery.rechazados.length > 0)) return gallery;
    // Si el usuario canceló la galería, no forzamos el selector de archivos:
    // devolvemos vacío y la UI decide si ofrecer «Archivos».
    if (gallery) return gallery;
  }

  return pickFilesAsAssets(accept, multiple);
}

/** Abre la cámara del móvil para tomar una foto y guardarla como recurso. */
export async function takePhotoAsAsset(): Promise<ImportResult> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    });
    if (!photo.base64String) return { agregados: 0, rechazados: [] };
    const actuales = getCustomAssets();
    actuales.push({
      id: `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      name: 'Foto con cámara',
      kind: 'imagen',
      mime: `image/${photo.format ?? 'jpeg'}`,
      dataUrl: `data:image/${photo.format ?? 'jpeg'};base64,${photo.base64String}`,
      size: 0,
      createdAt: Date.now(),
      tags: []
    });
    persist(actuales);
    return { agregados: 1, rechazados: [] };
  } catch {
    // Sin cámara (web/PC): abrir el selector de archivos como alternativa.
    return pickAssetsFromDevice({ accept: 'image/*', multiple: true });
  }
}

/** Recursos filtrados por tipo para los nodos de vídeo / sonido. */
export function getVideoAssets(): CustomAsset[] {
  return getCustomAssets().filter((a) => a.kind === 'video');
}

export function getAudioAssets(): CustomAsset[] {
  return getCustomAssets().filter((a) => a.kind === 'audio');
}

/** Guarda un dataURL ya generado (p. ej. composición del editor) como imagen. */
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

/** Sustituye las etiquetas de un asset (máx 12, normalizadas). */
export function setAssetTags(id: string, tags: string[]): boolean {
  const actuales = getCustomAssets();
  const target = actuales.find((a) => a.id === id);
  if (!target) return false;
  target.tags = normalizeTags(tags);
  persist(actuales);
  return true;
}

/** Todas las etiquetas usadas en la carpeta, ordenadas por frecuencia. */
export function getAllAssetTags(): { tag: string; count: number }[] {
  const freq = new Map<string, number>();
  for (const a of getCustomAssets()) {
    for (const t of normalizeTags(a.tags)) freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  return [...freq.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
