// Assets: catálogo de personajes y filtros (extraído de lib/assets.ts — barrel en lib/assets.ts).
import { CHARACTER_ASSETS } from '../studio/data/assets';
import type { CustomAsset } from './types';
import { getCustomAssets } from './store';
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

/** Resuelve el personaje de un nodo. Devuelve null si no hay personaje asignado
 *  o el recurso se eliminó (antes caía a Sora y provocaba el "fondo fantasma"). */
export function resolveCharacter(id: string | undefined | null): any | null {
  if (!id) return null;
  const catalog = getCharacterCatalog();
  return catalog[id] ?? null;
}

export function getVideoAssets(): CustomAsset[] {
  return getCustomAssets().filter((a) => a.kind === 'video');
}
export function getAudioAssets(): CustomAsset[] {
  return getCustomAssets().filter((a) => a.kind === 'audio');
}
