// @ts-nocheck
// Estudio de cuadros de diálogo: diseños importables + tipografías + animaciones.
// - Biblioteca en localStorage (getAllDialogueThemes) + tema global del proyecto
//   (VNState.dialogueThemeId, persiste en slots/autosave al ser parte del state).
// - Cada nodo puede usar el tema global o su propio override (dlgThemeId/dlgFont/...).
import { ctx } from '../context';
import { scheduleAutosave } from '../storage';
import { escapeHtml } from '../domain/geometry';
import { playSynthSfx } from '../domain/audio';
import { showToast } from './toast';
import {
  DIALOGUE_ANIMATIONS,
  DIALOGUE_FONTS,
  blankDialogueTheme,
  deleteCustomDialogueTheme,
  dialogueAnimationCss,
  fontStackOf,
  getActiveDialogueThemeId,
  getAllDialogueThemes,
  getDialogueTheme,
  getProjectDialogueThemeId,
  saveCustomDialogueTheme,
  setActiveDialogueThemeId
} from '../../dialogue-themes';

function ensureAnimStyleTag() {
  let tag = document.getElementById('vnDlgAnimCss');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'vnDlgAnimCss';
    tag.textContent = dialogueAnimationCss();
    document.head.appendChild(tag);
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('read'));
    r.readAsDataURL(file);
  });
}

async function pickBoxImage(): Promise<string | null> {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,.png,.jpg,.jpeg,.webp,.gif';
  input.style.display = 'none';
  document.body.appendChild(input);
  try {
    const picked = await new Promise<File | null>((resolve) => {
      let done = false;
      const finish = (f: File | null) => {
        if (done) return;
        done = true;
        resolve(f);
      };
      input.onchange = () => finish(input.files?.[0] ?? null);
      input.oncancel = () => finish(null);
      setTimeout(() => finish(input.files?.[0] ?? null), 60000);
      input.click();
    });
    if (!picked) return null;
    if (picked.size > 8 * 1024 * 1024) {
      showToast('Esa imagen pesa más de 8 MB: elige una más ligera para el cuadro');
      return null;
    }
    return await readFileAsDataUrl(picked);
  } finally {
    input.remove();
  }
}

function previewHtml(theme, sample = '¡Hola! Este es tu cuadro de diálogo personalizado. ¿A dónde vamos?') {
  const esc = escapeHtml(sample);
  return `
    <div style="${theme.boxImage ? `background-image:url('${theme.boxImage}');background-size:cover;background-position:center;` : `background:${escapeHtml(theme.boxColor)};`}border:${Math.max(0, theme.borderWidth)}px solid ${escapeHtml(theme.borderColor)};border-radius:${Math.max(0, theme.borderRadius)}px;padding:16px 18px;box-shadow:0 10px 30px rgba(0,0,0,0.45);">
      <div style="font-weight:800;font-size:14px;margin-bottom:6px;color:${escapeHtml(theme.speakerColor)};font-family:${fontStackOf(theme.font)};">Sora</div>
      <div class="vn-dlg-letters vn-dlg-anim-${escapeHtml(theme.animation)}" style="font-family:${fontStackOf(theme.font)};font-size:${Number(theme.fontSize) || 16}px;color:${escapeHtml(theme.fontColor)};line-height:1.55;">${esc}</div>
      <div style="margin-top:8px;font-size:11px;opacity:0.75;color:${escapeHtml(theme.fontColor)};">${escapeHtml(DIALOGUE_ANIMATIONS.find((a) => a.id === theme.animation)?.label ?? theme.animation)} · ${escapeHtml(DIALOGUE_FONTS.find((f) => f.id === theme.font)?.label ?? theme.font)}</div>
    </div>`;
}

/** Aplica el tema resuelto al modal de prueba (caja + fuentes + animación letra a letra). */
export function applyDialogueThemeToPlaytest(node) {
  ensureAnimStyleTag();
  const projectId = getProjectDialogueThemeId(ctx.state);
  const theme = getDialogueTheme(
    node?.dlgThemeId && node.dlgThemeId !== 'global' ? node.dlgThemeId : projectId
  );
  const merged = { ...theme };
  if (node?.dlgFont) merged.font = node.dlgFont;
  if (node?.dlgAnimation) merged.animation = node.dlgAnimation;
  if (typeof node?.dlgFontSize === 'number' && node.dlgFontSize > 0) merged.fontSize = node.dlgFontSize;
  if (node?.dlgFontColor) merged.fontColor = node.dlgFontColor;

  const box = (document.getElementById('vnDialogueBox') as HTMLElement | null)
    ?? document.querySelector('#playtestModal [id="vnDialogueText"]')?.parentElement as HTMLElement | null;
  if (box) {
    box.style.background = '';
    box.style.backgroundColor = merged.boxColor;
    box.style.backgroundImage = merged.boxImage ? `url("${merged.boxImage}")` : '';
    box.style.backgroundSize = 'cover';
    box.style.backgroundPosition = 'center';
    box.style.borderColor = merged.borderColor;
    box.style.borderWidth = `${Math.max(0, merged.borderWidth)}px`;
    box.style.borderRadius = `${Math.max(0, merged.borderRadius)}px`;
  }
  const speaker = document.getElementById('vnSpeakerName');
  if (speaker) {
    speaker.style.fontFamily = fontStackOf(merged.font);
    if (!node?.speakerColor) speaker.style.color = merged.speakerColor;
  }
  animateDialogueText(merged);
  return merged;
}

let __typeTimer: ReturnType<typeof setInterval> | null = null;

/** Renderiza #vnDialogueText con la animación de letras del tema. */
export function animateDialogueText(theme, explicitText?: string) {
  ensureAnimStyleTag();
  const el = document.getElementById('vnDialogueText');
  if (!el) return;
  const full = explicitText ?? el.textContent ?? '';
  if (__typeTimer) {
    clearInterval(__typeTimer);
    __typeTimer = null;
  }
  const speed = Math.max(0.25, Number(theme?.animSpeed) || 1);
  const anim = theme?.animation ?? 'none';
  el.style.fontFamily = fontStackOf(theme?.font ?? 'novela-sans');
  el.style.fontSize = `${Number(theme?.fontSize) || 16}px`;
  el.style.color = theme?.fontColor ?? '#f1f5f9';
  el.classList.add('vn-dlg-letters');
  el.classList.remove(
    'vn-dlg-anim-fade', 'vn-dlg-anim-slide-up', 'vn-dlg-anim-wave',
    'vn-dlg-anim-bounce', 'vn-dlg-anim-blur-in', 'vn-dlg-anim-rainbow'
  );

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!anim || anim === 'none' || reduceMotion) {
    el.textContent = full;
    return;
  }
  if (anim === 'typewriter') {
    // Máquina de escribir real: revela letra a letra (rápido pero legible).
    el.textContent = '';
    let i = 0;
    const step = Math.max(1, Math.round(speed));
    const delay = Math.max(8, Math.round(34 / speed));
    __typeTimer = setInterval(() => {
      i += step;
      el.textContent = full.slice(0, i);
      if (i >= full.length) {
        if (__typeTimer) clearInterval(__typeTimer);
        __typeTimer = null;
      }
    }, delay);
    // Clic en el texto completa la frase al instante.
    el.onclick = () => {
      if (__typeTimer) {
        clearInterval(__typeTimer);
        __typeTimer = null;
        el.textContent = full;
      }
    };
    return;
  }
  // Resto de animaciones: una <span> por letra con delay escalonado.
  el.innerHTML = '';
  el.classList.add(`vn-dlg-anim-${anim}`);
  const baseDelay = anim === 'wave' || anim === 'rainbow' ? 0.06 : 0.028 / speed;
  [...full].forEach((ch, idx) => {
    const s = document.createElement('span');
    s.textContent = ch;
    if (anim === 'wave' || anim === 'rainbow') {
      s.style.animationDelay = `${(idx * 0.06).toFixed(2)}s`;
    } else {
      s.style.animationDelay = `${(idx * baseDelay).toFixed(3)}s`;
    }
    el.appendChild(s);
  });
}

/** Estudio completo: elegir tema global, importar diseños, crear/editar. */
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
