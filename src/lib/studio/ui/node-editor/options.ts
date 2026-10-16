// @ts-nocheck
// Node-editor: opciones de personaje/expresión (extraído de ui/node-editor.ts — barrel en ui/node-editor.ts).
import { getCharacterCatalog } from '../../../assets';
import { escapeHtml } from '../../domain/geometry';
export function charOptions(selectedId?: string) {
  const catalog = getCharacterCatalog();
  const noneSel = !selectedId ? 'selected' : '';
  return `<option value="" ${noneSel}>— Sin personaje —</option>` + Object.values(catalog)
    .map((c) => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`)
    .join('');
}

export function expressionOptions(selectedCharId?: string, current?: string) {
  const catalog = getCharacterCatalog();
  const all = new Set<string>();
  Object.values(catalog).forEach((c) => (c.expressions || []).forEach((e) => all.add(e)));
  const selChar = catalog[selectedCharId ?? ''];
  const list = selChar?.expressions?.length ? selChar.expressions : [...all];
  return list.map((e) => `<option value="${escapeHtml(e)}" ${e === current ? 'selected' : ''}>${escapeHtml(e)}</option>`).join('');
}

