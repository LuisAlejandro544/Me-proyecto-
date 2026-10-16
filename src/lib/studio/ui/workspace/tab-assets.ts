// @ts-nocheck
// Workspace: pestaña recursos (extraído de ui/workspace.ts — barrel en ui/workspace.ts).
import { ctx } from '../../context';
import { pushHistory } from '../../domain/history';
import { wsUi } from './state';
import { animateTabSwitch } from './tab-switch';
import { escapeHtml } from '../../domain/geometry';
import { getAllAssetTags, getCustomAssets, assetSizeLabel } from '../../../assets';
import { allCharacterAssets, assetPreviewHtml, handleImportResult, wireFolderActions } from './folder';
import { renderNodes } from '../render-nodes';
import { showToast } from '../toast';
import {
  PHOTO_VIDEO_TAPS_REQUIRED,
  confirmPhotoVideoTouch,
  countTouchTap,
  isTouchMobile,
  resetTouchTaps
} from '../touch-edit';

export function renderAssetsTab(modal: HTMLElement, titleEl: HTMLElement, bodyEl: HTMLElement, reopen: (t: string) => void, tabName: string) {
    titleEl.textContent = '📁 Carpeta de recursos';
    const catalog = allCharacterAssets();
    const all = getCustomAssets();
    const allTags = getAllAssetTags();
    const q = wsUi.query.toLowerCase();
    const tagQ = wsUi.tag.toLowerCase();
    const customs = all.filter((a) => {
      if (wsUi.filter !== 'todos' && a.kind !== wsUi.filter) return false;
      if (tagQ && !(a.tags ?? []).some((t) => t.toLowerCase() === tagQ)) return false;
      if (q) {
        const hay = `${a.name} ${(a.tags ?? []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const totalKB = all.reduce((s, a) => s + (a.size || 0), 0);
    bodyEl.innerHTML = `
      <div class="vn-anim-card rounded-2xl overflow-hidden border border-amber-400/30 bg-gradient-to-b from-[#1a1430] to-[#101528]">
        <div class="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border-b border-white/10">
          <div class="text-3xl">📁</div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold text-white truncate">/ Recursos <span class="text-slate-400 font-normal">· ${all.length} archivo(s)</span></div>
            <div class="text-[11px] text-slate-400">Carpeta del proyecto · ~${(totalKB / 1024).toFixed(1)} KB guardados · pulsa ➕ para añadir más sin salir</div>
          </div>
          <span class="text-[10px] px-2 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">${customs.length}/${all.length} visibles</span>
        </div>
        <div class="p-3.5 space-y-2.5">
          <div class="flex flex-col sm:flex-row gap-2">
            <input id="assetSearch" value="${escapeHtml(wsUi.query)}" placeholder="🔍 Buscar por nombre o #etiqueta…"
              class="flex-1 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400/70" />
            <select id="assetFilter" class="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white outline-none">
              <option value="todos" ${wsUi.filter === 'todos' ? 'selected' : ''}>Todos</option>
              <option value="imagen" ${wsUi.filter === 'imagen' ? 'selected' : ''}>🖼 Imágenes</option>
              <option value="video" ${wsUi.filter === 'video' ? 'selected' : ''}>🎬 Vídeos</option>
              <option value="audio" ${wsUi.filter === 'audio' ? 'selected' : ''}>🎵 Audios</option>
            </select>
          </div>
          ${allTags.length ? `
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            <span class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">🏷 Etiquetas:</span>
            <button data-tag-filter="" class="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition min-h-[32px] ${!wsUi.tag ? 'bg-fuchsia-500 text-white border-fuchsia-400' : 'bg-slate-800 text-slate-300 border-slate-600'}">Todas</button>
            ${allTags.map((t) => `
              <button data-tag-filter="${escapeHtml(t.tag)}" class="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition min-h-[32px] ${wsUi.tag === t.tag ? 'bg-fuchsia-500 text-white border-fuchsia-400' : 'bg-slate-800 text-slate-300 border-slate-600'}">#${escapeHtml(t.tag)} · ${t.count}</button>
            `).join('')}
          </div>` : ''}
          <div class="flex flex-wrap gap-2">
            <button id="btnAddMoreFiles" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 transition active:scale-95 min-h-[44px]">
              ➕ Añadir más (archivos)
            </button>
            <button id="btnAddMoreGallery" class="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white transition active:scale-95 min-h-[44px]">
              🖼️ Galería
            </button>
            <button id="btnAddMoreVideo" class="px-4 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-xs font-bold text-white transition active:scale-95 min-h-[44px]">
              🎬 Vídeo
            </button>
            <button id="btnAddMoreAudio" class="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-xs font-bold text-white transition active:scale-95 min-h-[44px]">
              🎵 Audio
            </button>
            <button id="btnAddMoreCamera" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition active:scale-95 min-h-[44px]">
              📷 Cámara
            </button>
          </div>
          <p class="text-[11px] text-slate-400">En móvil: <b>Galería</b> abre tus fotos, <b>Vídeo</b> abre la galería de vídeos, <b>Audio</b>/<b>Archivos</b> abren el administrador y <b>Cámara</b> toma una foto. En web/PC se abre el explorador de archivos.</p>
        </div>
      </div>
      ${customs.length ? `
      <p class="text-xs text-slate-400 pt-3">Contenido de la carpeta — ✏️ renombra, 🏷 etiqueta, 🗑 elimina o pulsa para asignar al nodo seleccionado.</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
        ${customs.map(c => `
          <div data-asset-card="${c.id}" data-assign-char="${c.id}"
            class="vn-anim-card group relative p-2.5 rounded-xl bg-[#1d2442] hover:bg-[#27315a] border border-slate-700 hover:border-cyan-400/50 cursor-pointer text-center transition hover:-translate-y-0.5">
            ${assetPreviewHtml(c)}
            <div data-asset-name class="mt-2 text-xs font-bold text-white truncate px-1">${escapeHtml(c.name)}</div>
            <div class="text-[10px] text-slate-400">${c.kind === 'imagen' ? '🖼 Imagen' : c.kind === 'video' ? '🎬 Vídeo' : '🎵 Audio'} · ${assetSizeLabel(c.size)}</div>
            <div data-tags-box="${c.id}" class="mt-1.5 flex flex-wrap items-center justify-center gap-1 px-1">
              ${(c.tags ?? []).map((t) => `<button data-tag-filter="${escapeHtml(t)}" class="px-1.5 py-0.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-200 text-[10px] font-semibold">#${escapeHtml(t)}</button>`).join('') || `<span class="text-[10px] text-slate-500">sin etiquetas</span>`}
            </div>
            <div class="mt-1.5 flex items-center justify-center gap-1.5">
              <button data-rename-asset="${c.id}" title="Cambiar nombre" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 border border-slate-600 text-[11px] transition min-w-[44px] min-h-[36px]">✏️</button>
              <button data-edit-tags="${c.id}" title="Editar etiquetas" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-fuchsia-500 hover:text-white border border-slate-600 text-[11px] transition min-w-[44px] min-h-[36px]">🏷</button>
              <button data-remove-custom="${c.id}" title="Eliminar de la carpeta" class="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 hover:text-white border border-rose-500/40 text-[11px] transition min-w-[44px] min-h-[36px]">🗑</button>
            </div>
          </div>
        `).join('')}
      </div>` : `
      <div class="vn-anim-card mt-3 p-6 rounded-2xl border border-dashed border-slate-600 text-center">
        <div class="text-4xl mb-2">📂</div>
        <div class="text-sm font-bold text-white">Carpeta vacía</div>
        <p class="text-xs text-slate-400 mt-1">Usa ➕ Añadir más, 🖼️ Galería o 📷 Cámara para llenarla. Puedes seguir añadiendo más dentro de esta misma carpeta.</p>
      </div>`}
      <p class="text-xs text-slate-400 pt-3">Sprites incluidos (solo lectura):</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        ${Object.values(catalog).filter((c: any) => !c.custom).map((c: any) => `
          <div data-assign-char="${c.id}" class="vn-anim-card relative p-2.5 rounded-xl bg-[#1d2442] hover:bg-[#27315a] border border-slate-700/60 cursor-pointer text-center transition hover:-translate-y-0.5">
            <img src="${c.avatar}" loading="lazy" class="w-20 h-20 mx-auto rounded-xl object-cover mb-2 border border-white/15" />
            <div class="text-xs font-bold text-white truncate">${escapeHtml(c.name)}</div>
            <div class="text-[10px] text-cyan-300">${c.expressions.length} expresiones</div>
          </div>
        `).join('')}
      </div>
    `;
    modal.classList.remove('hidden');
    animateTabSwitch(tabName);

    const search = document.getElementById('assetSearch') as HTMLInputElement | null;
    const filter = document.getElementById('assetFilter') as HTMLSelectElement | null;
    search?.addEventListener('input', () => {
      wsUi.query = search.value;
      const pos = search.selectionStart ?? search.value.length;
      reopen('assets');
      const again = document.getElementById('assetSearch') as HTMLInputElement | null;
      again?.focus();
      try { again?.setSelectionRange(pos, pos); } catch {}
    });
    filter?.addEventListener('change', () => {
      wsUi.filter = filter.value as 'todos' | 'imagen' | 'video' | 'audio';
      reopen('assets');
    });
    bodyEl.querySelectorAll('[data-tag-filter]').forEach((btn) => {
      (btn as HTMLElement).onclick = (e) => {
        e.stopPropagation();
        wsUi.tag = (btn as HTMLElement).dataset.tagFilter ?? '';
        reopen('assets');
      };
    });

    wireFolderActions(() => reopen('assets'), 'assets');
    bodyEl.querySelectorAll('[data-assign-char]').forEach(card => {
      (card as HTMLElement).onclick = (ev) => {
        // Los botones ✏️/🏷/🗑 e inputs internos ya hacen stopPropagation,
        // pero lo ignoramos también aquí por defensa (si no, el ✏️ parece "no funcionar").
        const t = ev?.target as HTMLElement | null;
        if (t?.closest?.('button, input, [data-rename-box], [data-tags-edit]')) return;
        const node = ctx.state.nodes.find(n => n.id === ctx.selectedNodeId);
        const cId = (card as HTMLElement).dataset.assignChar;
        const catalogNow = allCharacterAssets();
        const customsNow = getCustomAssets();
        const customHit = customsNow.find((a) => a.id === cId);
        const isPhotoVideo = !!customHit
          ? (customHit.kind === 'imagen' || customHit.kind === 'video')
          : !!catalogNow[cId];
        // Foto/vídeo en móvil: contar los toques (1/2) y pedir confirmación
        // con popup antes de asignar al nodo (evita asignaciones accidentales).
        if (isPhotoVideo && isTouchMobile()) {
          const taps = countTouchTap(`assign:${cId}`);
          if (taps < PHOTO_VIDEO_TAPS_REQUIRED) {
            const kind = customHit?.kind === 'video' ? 'vídeo' : 'foto';
            showToast(`👆 Toque ${taps}/${PHOTO_VIDEO_TAPS_REQUIRED} sobre el ${kind} «${customHit?.name ?? catalogNow[cId]?.name ?? ''}» — toca de nuevo para asignar`);
            return;
          }
          resetTouchTaps(`assign:${cId}`);
          const nm = customHit?.name ?? catalogNow[cId]?.name ?? 'recurso';
          if (!confirmPhotoVideoTouch(nm, taps, 'asignar')) return;
        }
        if (node && catalogNow[cId]) {
          pushHistory();
          node.characterId = cId;
          node.selectedCharId = cId;
          node.speaker = catalogNow[cId].name;
          renderNodes();
          showToast(`«${catalogNow[cId].name}» asignado al nodo seleccionado`);
        } else if (cId && customsNow.find((a) => a.id === cId && a.kind === 'audio')) {
          const a = customsNow.find((x) => x.id === cId);
          if (node) {
            pushHistory();
            node.audioAssetId = a.id;
            node.audioName = a.name;
            if (node.type === 'sound_cue') {
              node.soundAssetId = a.id;
              node.soundName = a.name;
            }
            renderNodes();
            showToast(`🎵 «${a.name}» asignado como audio del nodo`);
          } else {
            showToast('Selecciona primero un nodo para asignarle el audio');
            return;
          }
        } else if (cId && customsNow.find((a) => a.id === cId && a.kind === 'video')) {
          const a = customsNow.find((x) => x.id === cId);
          if (node) {
            pushHistory();
            node.videoAssetId = a.id;
            node.videoName = a.name;
            renderNodes();
            showToast(`🎬 «${a.name}» asignado como vídeo del nodo`);
          } else {
            showToast('Selecciona primero un nodo para asignarle el vídeo');
            return;
          }
        }
        modal.classList.add('hidden');
      };
    });
  
}
