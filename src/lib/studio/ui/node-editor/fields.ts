// @ts-nocheck
// Node-editor: campos de estilo de diálogo (extraído de ui/node-editor.ts — barrel en ui/node-editor.ts).
import { escapeHtml } from '../../domain/geometry';
export function dialogueStyleFields(node: any, inputCls: string, field: (label: string, inner: string) => string): string {
  if (node.type === 'character_selector') return '';
  const themes = getAllDialogueThemes();
  const projectId = getProjectDialogueThemeId(ctx.state);
  const curTheme = node.dlgThemeId ?? 'global';
  const curFont = node.dlgFont ?? '';
  const curAnim = node.dlgAnimation ?? '';
  return `
    <div class="p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/40 space-y-2.5">
      <div class="flex items-center justify-between gap-2">
        <div class="text-[11px] uppercase tracking-wider text-fuchsia-200 font-bold">💬 Cuadro de diálogo de este nodo</div>
        <button id="ed_openDlgStudio" type="button" class="px-2.5 py-1.5 rounded-lg bg-fuchsia-500 text-white text-[11px] font-bold shrink-0 min-h-[36px]">Personalizar…</button>
      </div>
      ${field('Diseño del cuadro', `<select id="ed_dlgTheme" class="${inputCls}">
        <option value="global" ${curTheme === 'global' ? 'selected' : ''}>🌐 Tema global (${escapeHtml(themes.find((t) => t.id === projectId)?.name ?? 'Clásico')})</option>
        ${themes.map((t) => `<option value="${t.id}" ${curTheme === t.id ? 'selected' : ''}>${t.custom ? '🖼️' : '🎨'} ${escapeHtml(t.name)}</option>`).join('')}
      </select>`)}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${field('Tipografía (override)', `<select id="ed_dlgFont" class="${inputCls}">
          <option value="">— La del diseño —</option>
          ${DIALOGUE_FONTS.map((f) => `<option value="${f.id}" ${curFont === f.id ? 'selected' : ''}>${escapeHtml(f.label)}</option>`).join('')}
        </select>`)}
        ${field('Animación letras (override)', `<select id="ed_dlgAnim" class="${inputCls}">
          <option value="">— La del diseño —</option>
          ${DIALOGUE_ANIMATIONS.map((a) => `<option value="${a.id}" ${curAnim === a.id ? 'selected' : ''}>${escapeHtml(a.label)}</option>`).join('')}
        </select>`)}
      </div>
      <div class="grid grid-cols-2 gap-2">
        ${field(`Tamaño${node.dlgFontSize ? ` (${node.dlgFontSize}px)` : ' (auto)'}`, `<input id="ed_dlgFontSize" type="number" min="0" max="30" placeholder="auto" value="${node.dlgFontSize ?? ''}" class="${inputCls}" />`)}
        ${field('Color texto (override)', `<input id="ed_dlgFontColor" type="color" value="${escapeHtml(node.dlgFontColor ?? '#f1f5f9')}" class="w-full h-[44px] rounded-xl bg-[#0f1428] border border-slate-600 cursor-pointer" />`)}
      </div>
      <label class="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
        <input id="ed_dlgUseColor" type="checkbox" ${node.dlgFontColor ? 'checked' : ''} class="w-4 h-4 accent-fuchsia-400" />
        Usar este color de texto en vez del diseño
      </label>
    </div>`;
}

