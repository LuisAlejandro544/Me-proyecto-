// Assets: tipos, constantes y normalizeTags (extraído de lib/assets.ts — barrel en lib/assets.ts).
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

export const STORAGE_KEY = 'vn_custom_assets_v1';
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


export interface ImportResult {
  agregados: number;
  rechazados: string[];
}
