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
  if (m[1].length > 400_000) return null; // ~300 KB: más grande congela el WebView
  try {
    const payload = JSON.parse(fromB64Url(m[1]));
    const state = sanitizeSharedState(payload?.state);
    if (!state) return null;
    try { normalizeState(state); } catch {}
    return { permiso: payload.permiso === 'jugar' ? 'jugar' : 'jugar', state, proyecto: payload.proyecto || 'Nivel compartido' };
  } catch {
    return null;
  }
}

// Frontera de confianza: el hash lo escribe cualquiera, así que ningún id,
// color, cable o texto llega a ctx.state sin pasar por aquí. Los ids que no
// cumplen el patrón se descartan (las plantillas interpolan ids en atributos).
const SHARE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const SHARE_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
const MAX_SHARE_NODES = 500;
const MAX_SHARE_WIRES = 1000;
const MAX_SHARE_TEXT = 8000;

function sanitizeSharedNode(n: any): any | null {
  if (!n || typeof n !== 'object') return null;
  if (!SHARE_ID_RE.test(n.id ?? '') || typeof n.type !== 'string' || !n.type) return null;
  const c: any = { ...n };
  if (!Number.isFinite(c.x)) c.x = 0;
  if (!Number.isFinite(c.y)) c.y = 0;
  if (typeof c.speakerColor === 'string' && !SHARE_COLOR_RE.test(c.speakerColor)) delete c.speakerColor;
  if (Array.isArray(c.portsOut)) c.portsOut = c.portsOut.filter((p: any) => p && SHARE_ID_RE.test(p.id ?? ''));
  else delete c.portsOut;
  for (const k of ['dialogue', 'speaker', 'headerBar', 'badge', 'title', 'subtitle']) {
    if (typeof c[k] === 'string' && c[k].length > MAX_SHARE_TEXT) c[k] = c[k].slice(0, MAX_SHARE_TEXT);
  }
  return c;
}

export function sanitizeSharedState(state: any): any | null {
  if (!state || typeof state !== 'object') return null;
  if (!Array.isArray(state.nodes) || state.nodes.length === 0) return null;
  if (state.nodes.length > MAX_SHARE_NODES) return null;
  const nodes = state.nodes.map(sanitizeSharedNode).filter(Boolean);
  if (!nodes.length) return null;
  const ids = new Set(nodes.map((n: any) => n.id));
  const wires = Array.isArray(state.wires)
    ? state.wires.filter((w: any) =>
        w && SHARE_ID_RE.test(w.fromNode ?? '') && SHARE_ID_RE.test(w.toNode ?? '') &&
        ids.has(w.fromNode) && ids.has(w.toNode)).slice(0, MAX_SHARE_WIRES)
    : [];
  return { ...state, nodes, wires };
}
