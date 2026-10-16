// @ts-nocheck
// Compartir nivel por URL: codifica el grafo en el hash para jugar a pantalla completa.
// Por ahora un solo permiso: `jugar` (ver + jugar, sin editar).
import { ctx } from '../context';
import { escapeHtml } from '../domain/geometry';
import { renderNodes } from './render-nodes';
import { applyTransform } from './transform';
import { renderPlaytestStep } from './playtest';
import { showToast } from './toast';
import { getStartNodeId, normalizeState } from '../storage';
import { exportStandaloneHtmlFile } from './compile';

export type SharePermission = 'jugar';

function toB64Url(json: string): string {
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(s: string): string {
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return decodeURIComponent(escape(atob(b64)));
}

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
      zoom: ctx.state.zoom,
      panX: ctx.state.panX,
      panY: ctx.state.panY,
      variables: ctx.state.variables,
      nodes: ctx.state.nodes,
      wires: ctx.state.wires,
      dialogueThemeId: ctx.state.dialogueThemeId
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

export function openShareModal() {
  const modal = document.getElementById('drawerModal');
  const titleEl = document.getElementById('drawerModalTitle');
  const bodyEl = document.getElementById('drawerModalBody');
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = 'Compartir tu nivel con un amigo';

  const render = (permiso: SharePermission) => {
    const base = getShareBaseUrl();
    let url = '';
    try {
      url = buildShareUrl(permiso, base);
    } catch {
      url = '';
    }
    const tooLong = url.length > 7800;
    const local = isLocalOrPrivateHost();
    bodyEl.innerHTML = `
      <div class="space-y-4">
        <p class="text-xs text-slate-400 leading-relaxed">
          Tu amigo abrirá el enlace, verá pantallas de carga y jugará tu nivel
          <strong class="text-slate-200">a pantalla completa</strong> (sin editor).
        </p>
        ${local ? `<p class="text-[11px] leading-relaxed rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-200 p-3">⚠️ Estás en <b>${escapeHtml(location.hostname || 'localhost')}</b>: un enlace <i>localhost</i> <b>no se puede compartir</b> (solo existe en tu PC). Por eso la URL ya usa tu dirección pública. Si aún no despliegas, usa «📦 Descargar .html jugable» y envía ese archivo: funciona sin servidor.</p>` : ''}
        <label class="block">
          <span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Dirección pública del juego (editable)</span>
          <input id="shareBase" value="${escapeHtml(base)}" spellcheck="false"
            class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-400 min-h-[44px]" />
          <span class="block text-[11px] text-slate-500 mt-1">Ej.: tu GitHub Pages, Netlify o Vercel con <b>/</b> al final. Se guarda en este navegador.</span>
        </label>
        <label class="block">
          <span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Permiso del enlace</span>
          <select id="sharePerm" class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2.5 text-sm text-white min-h-[44px]">
            <option value="jugar" ${permiso === 'jugar' ? 'selected' : ''}>🎮 Solo jugar (pantalla completa)</option>
          </select>
          <span class="block text-[11px] text-slate-500 mt-1">Por ahora solo existe «Solo jugar». Más permisos (editar, comentar) llegarán en el roadmap.</span>
        </label>
        <label class="block">
          <span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Tu enlace compartible</span>
          <textarea id="shareUrl" rows="3" readonly onfocus="this.select()" inputmode="url" autocomplete="off" spellcheck="false" class="w-full rounded-xl bg-[#0f1428] border border-cyan-500/40 p-3 text-xs text-cyan-200 font-mono break-all">${escapeHtml(url)}</textarea>
        </label>
        ${tooLong ? `<p class="text-[11px] text-amber-300">⚠️ El nivel es muy grande (${(url.length / 1024).toFixed(1)} KB de URL; los vídeos pesan mucho). Algunos navegadores recortan enlaces de más de ~8 KB. Usa «📦 Descargar .html jugable» para compartirlo como archivo.</p>` : ''}
        <div class="text-[11px] text-slate-500">Incluye ${ctx.state.nodes.length} nodo(s) y ${ctx.state.wires.length} conexión(es).</div>
        <div class="flex flex-wrap justify-end gap-2 pt-1">
          <button id="shareClose" class="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 min-h-[44px]">Cerrar</button>
          <button id="shareHtml" class="px-4 py-2.5 rounded-xl bg-indigo-500 text-xs font-bold text-white min-h-[44px]">📦 .html jugable</button>
          <button id="sharePreview" class="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-xs font-semibold text-slate-200 min-h-[44px]">👁 Probar como invitado</button>
          <button id="shareCopy" class="px-5 py-2.5 rounded-xl bg-emerald-500 text-xs font-bold text-slate-950 min-h-[44px]">🔗 Copiar URL</button>
        </div>
      </div>`;
    modal.classList.remove('hidden');
    (document.getElementById('shareClose') as HTMLElement).onclick = () => modal.classList.add('hidden');
    (document.getElementById('sharePerm') as HTMLSelectElement).onchange = (e) => render((e.target as HTMLSelectElement).value as SharePermission);
    const baseInput = document.getElementById('shareBase') as HTMLInputElement | null;
    baseInput?.addEventListener('change', () => {
      setShareBaseUrl(baseInput.value);
      render(permiso);
      showToast('Dirección pública guardada 🔗');
    });
    (document.getElementById('sharePreview') as HTMLElement).onclick = () => {
      modal.classList.add('hidden');
      enterSharedPlayMode({ permiso, state: JSON.parse(JSON.stringify(ctx.state)), proyecto: ctx.state.projectName }, { demo: true });
    };
    (document.getElementById('shareHtml') as HTMLElement).onclick = () => {
      downloadPlayableHtml();
    };
    (document.getElementById('shareCopy') as HTMLElement).onclick = async () => {
      const ta = document.getElementById('shareUrl') as HTMLTextAreaElement;
      const done = () => showToast('¡Enlace copiado! Pásaselo a tu amigo 🔗');
      try {
        await navigator.clipboard.writeText(ta.value);
        done();
      } catch {
        ta.select();
        try {
          document.execCommand('copy');
          done();
        } catch {
          showToast('Copia el enlace manualmente (mantén pulsado)');
        }
      }
    };
  };
  render('jugar');
}

/** Descarga un .html jugable con el nivel incrustado: se puede enviar por chat/correo sin servidor. */
export async function downloadPlayableHtml() {
  try {
    await exportStandaloneHtmlFile();
  } catch { showToast('No se pudo generar el .html'); }
}

function setLoading(show: boolean, msg = '', pct = 5) {  const overlay = document.getElementById('shareLoading');
  if (!overlay) return;
  overlay.classList.toggle('hidden', !show);
  overlay.classList.toggle('flex', show);
  const msgEl = document.getElementById('shareLoadingMsg');
  const bar = document.getElementById('shareLoadingBar');
  if (msgEl && msg) msgEl.textContent = msg;
  if (bar) bar.style.width = `${Math.max(5, Math.min(100, pct))}%`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Carga el nivel compartido con pantallas de carga y abre el reproductor a pantalla completa. */
export async function enterSharedPlayMode(
  shared: { permiso: SharePermission; state: any; proyecto: string },
  opts: { demo?: boolean } = {}
) {
  setLoading(true, 'Conectando con la historia…', 8);
  await sleep(260);
  setLoading(true, `Cargando «${shared.proyecto}»…`, 28);
  await sleep(280);

  // Aplica el estado compartido en memoria (sin tocar el proyecto del editor salvo en demo).
  ctx.state = JSON.parse(JSON.stringify(shared.state));
  ctx.selectedNodeId = getStartNodeId(ctx.state);
  setLoading(true, `Cargando personajes (${ctx.state.nodes.length} nodos)…`, 55);
  await sleep(300);
  try {
    applyTransform();
    renderNodes();
  } catch {}
  setLoading(true, 'Preparando escenario a pantalla completa…', 82);
  await sleep(320);

  document.body.classList.add('shared-play-mode');
  const modal = document.getElementById('playtestModal');
  modal?.classList.remove('hidden');
  const badge = document.getElementById('vnCurrentNodeBadge');
  const closeBtn = document.getElementById('btnClosePlaytest');
  if (closeBtn) {
    closeBtn.textContent = opts.demo ? 'Volver al editor' : 'Salir';
    (closeBtn as HTMLElement).onclick = () => {
      if (opts.demo) {
        document.body.classList.remove('shared-play-mode');
        modal?.classList.add('hidden');
      } else {
        // En modo invitado no hay editor: vuelve a una pantalla neutra.
        setLoading(true, 'Gracias por jugar 🎮', 100);
        setTimeout(() => {
          location.hash = '';
          location.reload();
        }, 700);
      }
    };
  }
  const __startId = getStartNodeId(ctx.state);
  if (__startId) renderPlaytestStep(__startId);
  if (badge) badge.textContent = `${shared.proyecto} · modo invitado`;
  setLoading(true, '¡Listo! 🎬', 100);
  await sleep(280);
  setLoading(false);
  showToast(`Jugando «${shared.proyecto}» como invitado 🎮`);
}

/** Al arrancar: si la URL trae #nivel=…, entra directo en modo jugar. */
export async function checkSharedPlayModeOnBoot(): Promise<boolean> {
  const shared = parseShareHash();
  if (!shared) return false;
  // Deja que el DOM pinte primero la pantalla de carga.
  await sleep(60);
  await enterSharedPlayMode(shared);
  return true;
}
