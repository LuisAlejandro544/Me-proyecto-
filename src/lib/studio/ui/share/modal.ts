// @ts-nocheck
// Share: modal Compartir nivel (extraído de ui/share.ts — barrel en ui/share.ts).
import { ctx } from '../../context';
import { escapeHtml } from '../../domain/geometry';
import { showToast } from '../toast';
import { getStartNodeId } from '../../storage';
import type { SharePermission } from './codec';
import { buildShareUrl, getShareBaseUrl, isLocalOrPrivateHost, setShareBaseUrl } from './base';
import { downloadPlayableHtml, enterSharedPlayMode } from './play';
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
