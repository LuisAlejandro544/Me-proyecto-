// @ts-nocheck
// Share: URL base y construcción/parseo del enlace (extraído de ui/share.ts — barrel en ui/share.ts).
import { ctx } from '../../context';
import { getStartNodeId, normalizeState } from '../../storage';
import type { SharePermission } from './codec';
import { fromB64Url, toB64Url } from './codec';
const SHARE_BASE_KEY = 'vn_share_base_url_v1';
/** Heurística de despliegue público para este repo (GitHub Pages). */
function defaultPublicBase(): string {
  return 'https://luisalejandro544.github.io/Me-proyecto-/';
}

export function isLocalOrPrivateHost(host = location.hostname): boolean {
  const h = (host || '').toLowerCase();
  if (!h || h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]') return true;
  if (h.endsWith('.local') || h.endsWith('.lan') || h.endsWith('.internal')) return true;
  if (/^192\.168\./.test(h) || /^10\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (location.protocol === 'file:') return true;
  return false;
}

export function getShareBaseUrl(): string {
  try {
    const saved = (localStorage.getItem(SHARE_BASE_KEY) || '').trim();
    if (saved) return saved.replace(/\/?$/, '/');
  } catch {}
  // Si estamos en local, el enlace localhost NO se puede compartir:
  // se usa la URL pública por defecto (editable en el modal).
  if (isLocalOrPrivateHost()) return defaultPublicBase();
  return `${location.origin}${location.pathname}`.replace(/\/?$/, '/');
}

export function setShareBaseUrl(base: string): void {
  try {
    localStorage.setItem(SHARE_BASE_KEY, (base || '').trim());
  } catch {}
}

export function buildShareUrl(permission: SharePermission = 'jugar', baseOverride?: string): string {
  const payload = {
    v: 1,
    permiso: permission,
    proyecto: ctx.state.projectName,
    state: {
      projectName: ctx.state.projectName,
      startNodeId: ctx.state.startNodeId,
      scenes: ctx.state.scenes ?? [],
      zoom: ctx.state.zoom,
      panX: ctx.state.panX,
      panY: ctx.state.panY,
      variables: ctx.state.variables,
      nodes: ctx.state.nodes,
      wires: ctx.state.wires,
      dialogueThemeId: ctx.state.dialogueThemeId,
      defaultAssetEnter: ctx.state.defaultAssetEnter,
      defaultAssetMotion: ctx.state.defaultAssetMotion,
      defaultSceneTransition: ctx.state.defaultSceneTransition,
      animDurationMs: ctx.state.animDurationMs
    }
  };
  const base = (baseOverride ?? getShareBaseUrl()).replace(/\/?$/, '/');
  return `${base}#nivel=${toB64Url(JSON.stringify(payload))}`;
}

export function parseShareHash(hash = location.hash): null | { permiso: SharePermission; state: any; proyecto: string } {
  const m = (hash || '').match(/nivel=([A-Za-z0-9\-_]+)/);
  if (!m) return null;
  try {
    const payload = JSON.parse(fromB64Url(m[1]));
    if (!payload?.state?.nodes) return null;
    try { normalizeState(payload.state); } catch {}
    return { permiso: payload.permiso === 'jugar' ? 'jugar' : 'jugar', state: payload.state, proyecto: payload.proyecto || 'Nivel compartido' };
  } catch {
    return null;
  }
}
