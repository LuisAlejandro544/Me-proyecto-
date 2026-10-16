// @ts-nocheck
// Diálogos: estudio de diseños (extraído de ui/dialogue.ts — barrel en ui/dialogue.ts).
import { ctx } from '../../context';
import { scheduleAutosave } from '../../storage';
import { escapeHtml } from '../../domain/geometry';
import { playSynthSfx } from '../../domain/audio';
import { showToast } from '../toast';
import {
  blankDialogueTheme, deleteCustomDialogueTheme, fontStackOf,
  getActiveDialogueThemeId, getAllDialogueThemes, getDialogueTheme,
  getProjectDialogueThemeId, saveCustomDialogueTheme, setActiveDialogueThemeId,
} from '../../../dialogue-themes';
import { ensureAnimStyleTag, pickBoxImage, previewHtml } from './io';
import { animateDialogueText } from './apply';
export function openDialogueStudio() {
  playSynthSfx('click');
  ensureAnimStyleTag();
  const modal = document.getElementById('drawerModal');
  const titleEl = document.getElementById('drawerModalTitle');
  const bodyEl = document.getElementById('drawerModalBody');
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = 'Cuadros de diálogo personalizados';

  const render = (editingId?: string | null) => {
    const themes = getAllDialogueThemes();
    const projectId = getProjectDialogueThemeId(ctx.state);
    const editing = editingId ? themes.find((t) => t.id === editingId) : null;

    const fontOpts = (sel?: string) =>
      DIALOGUE_FONTS.map((f) => `<option value="${f.id}" ${f.id === sel ? 'selected' : ''}>${escapeHtml(f.label)}</option>`).join('');
    const animOpts = (sel?: string) =>
      DIALOGUE_ANIMATIONS.map((a) => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${escapeHtml(a.label)} — ${escapeHtml(a.desc)}</option>`).join('');

    bodyEl.innerHTML = `
      <div class="space-y-4">
        <div class="p-3.5 rounded-xl bg-[#101528] border border-cyan-500/30">
          <div class="font-bold text-cyan-300 text-sm">💬 Tema global del proyecto</div>
          <p class="text-xs text-slate-400 mt-1">Se aplica a todos los nodos que usen «Tema global». Cada nodo puede tener el suyo propio desde ✏️ Editar nodo.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 max-h-56 overflow-y-auto pr-1">
            ${themes.map((t) => `
              <button data-dlg-pick="${t.id}" class="text-left p-2.5 rounded-xl border transition min-h-[44px] ${projectId === t.id ? 'bg-cyan-500/15 border-cyan-400' : 'bg-slate-800/60 border-slate-700 hover:border-cyan-400/50'}">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold text-white truncate">${projectId === t.id ? '✅ ' : ''}${escapeHtml(t.name)}</span>
                  ${t.custom ? '<span class="text-[10px] px-1.5 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 shrink-0">tuyo</span>' : '<span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300 shrink-0">base</span>'}
                </div>
                <div class="text-[11px] text-slate-400 truncate mt-0.5">${escapeHtml(DIALOGUE_FONTS.find((f) => f.id === t.font)?.label ?? t.font)} · ${escapeHtml(DIALOGUE_ANIMATIONS.find((a) => a.id === t.animation)?.label ?? t.animation)}</div>
              </button>`).join('')}
          </div>
        </div>

        <div class="p-3.5 rounded-xl bg-[#101528] border border-slate-700">
          <div class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Vista previa (tema global)</div>
          ${previewHtml(getDialogueTheme(projectId))}
        </div>

        <div class="flex flex-wrap gap-2">
          <button id="dlgNew" class="px-4 py-2.5 rounded-xl bg-cyan-500 text-xs font-bold text-slate-950 min-h-[44px]">＋ Nuevo diseño</button>
          <button id="dlgImportBg" class="px-4 py-2.5 rounded-xl bg-fuchsia-500 text-xs font-bold text-white min-h-[44px]">🖼️ Importar fondo (nuevo diseño)</button>
        </div>

        ${editing ? `
        <div class="p-3.5 rounded-xl bg-[#0f1428] border border-fuchsia-400/40 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div class="font-bold text-white text-sm">✏️ Editando «${escapeHtml(editing.name)}»</div>
            <button id="dlgCancelEdit" class="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-200 min-h-[36px]">Cerrar</button>
          </div>
          <label class="block">
            <span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Nombre del diseño</span>
            <input id="dlgName" value="${escapeHtml(editing.name)}" maxlength="48" class="w-full rounded-xl bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm text-white outline-none focus:border-fuchsia-400 min-h-[44px]" />
          </label>
          <div class="grid grid-cols-2 gap-2">
            <label class="block"><span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Fondo</span>
              <input id="dlgBoxColor" type="color" value="${escapeHtml(editing.boxColor)}" class="w-full h-[44px] rounded-xl bg-slate-900 border border-slate-600 cursor-pointer" /></label>
            <label class="block"><span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Borde</span>
              <input id="dlgBorderColor" type="color" value="${escapeHtml(editing.borderColor)}" class="w-full h-[44px] rounded-xl bg-slate-900 border border-slate-600 cursor-pointer" /></label>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <label class="block"><span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Grosor borde (${editing.borderWidth}px)</span>
              <input id="dlgBorderWidth" type="range" min="0" max="8" value="${editing.borderWidth}" class="vn-slider mt-3" /></label>
            <label class="block"><span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Redondez (${editing.borderRadius}px)</span>
              <input id="dlgBorderRadius" type="range" min="0" max="32" value="${editing.borderRadius}" class="vn-slider mt-3" /></label>
          </div>
          <div class="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700">
            ${editing.boxImage ? `<img src="${editing.boxImage}" class="w-16 h-10 rounded-lg object-cover border border-white/20" alt="fondo" />` : '<span class="text-xs text-slate-400">Sin imagen: usa el color de fondo.</span>'}
            <button id="dlgBoxImg" class="px-3 py-2 rounded-xl bg-indigo-500 text-xs font-bold text-white min-h-[44px]">🖼️ ${editing.boxImage ? 'Cambiar imagen' : 'Añadir imagen de fondo'}</button>
            ${editing.boxImage ? '<button id="dlgBoxImgClear" class="px-3 py-2 rounded-xl bg-slate-700 text-xs font-semibold text-slate-200 min-h-[44px]">Quitar imagen</button>' : ''}
          </div>
          <label class="block"><span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Tipografía (muchas para elegir)</span>
            <select id="dlgFont" class="w-full rounded-xl bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm text-white min-h-[44px]" style="font-family:${fontStackOf(editing.font)};">${fontOpts(editing.font)}</select></label>
          <div class="grid grid-cols-2 gap-2">
            <label class="block"><span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Tamaño (${editing.fontSize}px)</span>
              <input id="dlgFontSize" type="range" min="12" max="26" value="${editing.fontSize}" class="vn-slider mt-3" /></label>
            <label class="block"><span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Texto</span>
              <input id="dlgFontColor" type="color" value="${escapeHtml(editing.fontColor)}" class="w-full h-[44px] rounded-xl bg-slate-900 border border-slate-600 cursor-pointer" /></label>
          </div>
          <label class="block"><span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Color del hablante</span>
            <input id="dlgSpeakerColor" type="color" value="${escapeHtml(editing.speakerColor)}" class="w-full h-[44px] rounded-xl bg-slate-900 border border-slate-600 cursor-pointer" /></label>
          <label class="block"><span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Animación de las letras</span>
            <select id="dlgAnim" class="w-full rounded-xl bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm text-white min-h-[44px]">${animOpts(editing.animation)}</select></label>
          <label class="block"><span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Velocidad (×${editing.animSpeed})</span>
            <input id="dlgAnimSpeed" type="range" min="0.5" max="3" step="0.1" value="${editing.animSpeed}" class="vn-slider mt-3" /></label>
          <div class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Vista previa en vivo</div>
          <div id="dlgLivePreview">${previewHtml(editing)}</div>
          <div class="flex flex-wrap justify-between gap-2 pt-1">
            ${editing.custom ? '<button id="dlgDelete" class="px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/50 text-xs font-bold text-rose-300 min-h-[44px]">🗑 Eliminar diseño</button>' : '<span class="text-[11px] text-slate-500 self-center">Los diseños base no se borran: duplícalos con «Guardar como nuevo».</span>'}
            <div class="flex gap-2">
              <button id="dlgSaveCopy" class="px-4 py-2.5 rounded-xl bg-slate-700 text-xs font-bold text-white min-h-[44px]">⧉ Guardar como nuevo</button>
              <button id="dlgSave" class="px-5 py-2.5 rounded-xl bg-cyan-500 text-xs font-bold text-slate-950 min-h-[44px]">Guardar</button>
            </div>
          </div>
        </div>` : `
        <div class="p-3.5 rounded-xl border border-dashed border-slate-600 text-xs text-slate-400">
          Pulsa cualquier diseño de la lista para editarlo, o crea uno nuevo con tu propia imagen de fondo, tipografía y animación de letras.
          <div class="mt-2 flex flex-wrap gap-2">
            ${themes.filter((t) => t.custom).map((t) => `<button data-dlg-edit="${t.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-xs text-slate-200 min-h-[36px]">✏️ ${escapeHtml(t.name)}</button>`).join('') || '<span class="text-slate-500">Aún no tienes diseños propios: los base se pueden usar y duplicar.</span>'}
            ${themes.filter((t) => !t.custom).map((t) => `<button data-dlg-edit="${t.id}" class="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-xs text-slate-400 min-h-[36px]">${escapeHtml(t.name)}</button>`).join('')}
          </div>
        </div>`}
      </div>`;
    modal.classList.remove('hidden');

    bodyEl.querySelectorAll('[data-dlg-pick]').forEach((b) => {
      b.onclick = () => {
        playSynthSfx('click');
        const id = b.dataset.dlgPick;
        ctx.state.dialogueThemeId = id;
        setActiveDialogueThemeId(id);
        scheduleAutosave();
        showToast('Tema global de diálogo actualizado 💬');
        render(editingId);
      };
    });
    bodyEl.querySelectorAll('[data-dlg-edit]').forEach((b) => {
      b.onclick = () => render(b.dataset.dlgEdit);
    });
    document.getElementById('dlgNew')!.onclick = async () => {
      const fresh = blankDialogueTheme();
      saveCustomDialogueTheme(fresh);
      setActiveDialogueThemeId(fresh.id);
      render(fresh.id);
    };
    document.getElementById('dlgImportBg')!.onclick = async () => {
      showToast('Elige la imagen de tu cuadro de diálogo…');
      const img = await pickBoxImage();
      if (!img) {
        showToast('No se eligió ninguna imagen');
        return;
      }
      const fresh = { ...blankDialogueTheme(), name: 'Mi cuadro importado', boxImage: img };
      saveCustomDialogueTheme(fresh);
      showToast('Diseño importado 🖼️: ajústalo y pulsa Guardar');
      render(fresh.id);
    };

    if (editing) {
      const collect = () => ({
        ...editing,
        name: (document.getElementById('dlgName')).value,
        boxColor: (document.getElementById('dlgBoxColor')).value,
        borderColor: (document.getElementById('dlgBorderColor')).value,
        borderWidth: Number((document.getElementById('dlgBorderWidth')).value),
        borderRadius: Number((document.getElementById('dlgBorderRadius')).value),
        font: (document.getElementById('dlgFont')).value,
        fontSize: Number((document.getElementById('dlgFontSize')).value),
        fontColor: (document.getElementById('dlgFontColor')).value,
        speakerColor: (document.getElementById('dlgSpeakerColor')).value,
        animation: (document.getElementById('dlgAnim')).value,
        animSpeed: Number((document.getElementById('dlgAnimSpeed')).value)
      });
      const live = () => {
        const box = document.getElementById('dlgLivePreview');
        if (box) box.innerHTML = previewHtml(collect());
      };
      ['dlgName', 'dlgBoxColor', 'dlgBorderColor', 'dlgBorderWidth', 'dlgBorderRadius', 'dlgFont', 'dlgFontSize', 'dlgFontColor', 'dlgSpeakerColor', 'dlgAnim', 'dlgAnimSpeed'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.oninput = live;
      });
      const fontSel = document.getElementById('dlgFont');
      if (fontSel) fontSel.onchange = () => {
        fontSel.style.fontFamily = fontStackOf(fontSel.value);
        live();
      };
      document.getElementById('dlgCancelEdit')!.onclick = () => render(null);
      const imgBtn = document.getElementById('dlgBoxImg');
      if (imgBtn) imgBtn.onclick = async () => {
        const img = await pickBoxImage();
        if (!img) return;
        editing.boxImage = img;
        saveCustomDialogueTheme({ ...collect(), boxImage: img });
        render(editing.id);
      };
      const clearBtn = document.getElementById('dlgBoxImgClear');
      if (clearBtn) clearBtn.onclick = () => {
        saveCustomDialogueTheme({ ...collect(), boxImage: '' });
        render(editing.id);
      };
      document.getElementById('dlgSave')!.onclick = () => {
        const next = collect();
        if (!editing.custom && !getAllDialogueThemes().some((t) => t.custom && t.id === editing.id)) {
          // Editar un preset lo convierte en personalizado sin borrar el original.
          next.id = `dlg_${Date.now().toString(36)}`;
          next.custom = true;
        }
        saveCustomDialogueTheme(next);
        showToast('Diseño de diálogo guardado 💬');
        render(next.id);
      };
      document.getElementById('dlgSaveCopy')!.onclick = () => {
        const next = { ...collect(), id: `dlg_${Date.now().toString(36)}`, custom: true, createdAt: Date.now() };
        saveCustomDialogueTheme(next);
        showToast('Duplicado como diseño nuevo ⧉');
        render(next.id);
      };
      const del = document.getElementById('dlgDelete');
      if (del) del.onclick = () => {
        if (!confirm(`¿Eliminar el diseño «${editing.name}»?`)) return;
        deleteCustomDialogueTheme(editing.id);
        showToast('Diseño eliminado 🗑');
        render(null);
      };
    }
  };
  render(null);
}
