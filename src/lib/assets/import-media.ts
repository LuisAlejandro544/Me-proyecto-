// Assets: galería y cámara (Capacitor) (extraído de lib/assets.ts — barrel en lib/assets.ts).
import { ASSET_ACCEPT, AUDIO_ACCEPT, IMAGE_ACCEPT, MAX_ASSET_BYTES, VIDEO_ACCEPT } from './types';
import { isTauri } from '../platform';
import type { ImportResult } from './types';
import { addAssetFiles, getCustomAssets, persist } from './store';
import { isCapacitor } from '../platform';
import { importViaTauri, openSystemFilePicker, pickFilesAsAssets } from './import-files';
export async function importViaCapacitorGallery(limit = 10): Promise<ImportResult | null> {
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
