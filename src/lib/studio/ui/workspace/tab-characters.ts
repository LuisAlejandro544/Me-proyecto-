// @ts-nocheck
// Workspace: pestaña personajes (extraído de ui/workspace.ts — barrel en ui/workspace.ts).
import { animateTabSwitch } from './tab-switch';
import { escapeHtml } from '../../domain/geometry';
import { getCustomAssets } from '../../../assets';
import { allCharacterAssets, wireFolderActions } from './folder';

export function renderCharactersTab(modal: HTMLElement, titleEl: HTMLElement, bodyEl: HTMLElement, reopen: (t: string) => void, tabName: string) {
    titleEl.textContent = 'Reparto y perfiles de personajes';
    const catalog = allCharacterAssets();
    const customs = getCustomAssets().filter(a => a.kind === 'imagen');
    bodyEl.innerHTML = `
      <div class="vn-anim-card p-3.5 rounded-xl bg-[#101528] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2">
        <div class="text-xs text-slate-300">¿Quieres usar tus propias fotos como sprites? Añade más sin salir de esta carpeta.</div>
        <div class="flex flex-wrap gap-2">
          <button id="btnAddMoreFiles" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 transition min-h-[44px]">➕ Archivos</button>
          <button id="btnAddMoreGallery" class="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white transition min-h-[44px]">🖼️ Galería</button>
          <button id="btnAddMoreCamera" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition min-h-[44px]">📷 Cámara</button>
        </div>
      </div>
      <div class="space-y-3 pt-2">
        ${Object.values(catalog).map(c => `
          <div data-asset-card="${c.id}" class="vn-anim-card flex items-center gap-3.5 p-3 rounded-xl bg-[#101528] border border-slate-700/80 hover:border-cyan-400/40 transition">
            <img src="${c.avatar}" loading="lazy" class="w-14 h-14 rounded-xl object-cover border border-white/20 shrink-0" />
            <div class="flex-1 min-w-0">
              <div data-asset-name class="font-bold text-sm truncate" style="color:${c.color}">${escapeHtml(c.name)}${c.custom ? ' (tuyo)' : ''}</div>
              <div class="text-xs text-slate-400">Poses disponibles: ${c.expressions.join(' • ')}</div>
            </div>
            ${c.custom ? `
              <div class="flex gap-1.5 shrink-0">
                <button data-rename-asset="${c.id}" title="Cambiar nombre" class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-cyan-500 hover:text-slate-950 text-xs font-semibold text-slate-200 transition min-h-[44px]">✏️</button>
                <button data-remove-custom="${c.id}" title="Eliminar" class="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-xs font-semibold text-rose-300 transition min-h-[44px]">🗑</button>
              </div>` : ''}
          </div>
        `).join('')}
        ${customs.length ? '' : `<p class="text-[11px] text-slate-500">Consejo: en el móvil tienes Galería + Archivos + Cámara; en PC se abre el administrador de archivos.</p>`}
      </div>
    `;
    modal.classList.remove('hidden');
    animateTabSwitch(tabName);
    wireFolderActions(() => reopen('characters'), 'characters');
  
}
