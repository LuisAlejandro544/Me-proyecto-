// Assets: etiquetas de la carpeta (extraído de lib/assets.ts — barrel en lib/assets.ts).
import { normalizeTags } from './types';
import { getCustomAssets, persist } from './store';
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
