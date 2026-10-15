// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { escapeHtml } from '../domain/geometry';
import { pushHistory } from '../domain/history';
import { renderNodes } from './render-nodes';
import { showToast } from './toast';

export function openInlineEditorModal(node, prop, currentVal) {
  const modal = document.getElementById('drawerModal');
  document.getElementById('drawerModalTitle').textContent = `Editar nodo «${node.badge || node.title || node.headerBar || node.id}»`;
  document.getElementById('drawerModalBody').innerHTML = `
    <div class="space-y-3">
      <label class="block text-xs uppercase tracking-wider text-slate-400 font-semibold">Editar ${escapeHtml(prop)}</label>
      <textarea id="inlineEditTextarea" rows="4" class="w-full rounded-xl bg-[#0f1428] border border-slate-600 p-3 text-sm text-white focus:border-cyan-400 outline-none">${escapeHtml(currentVal)}</textarea>
      <div class="flex justify-end gap-2 pt-2">
        <button id="btnCancelInline" class="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancelar</button>
        <button id="btnSaveInline" class="px-4 py-2 rounded-xl bg-cyan-500 text-xs font-bold text-slate-950">Guardar cambios</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  document.getElementById('btnCancelInline').onclick = () => modal.classList.add('hidden');
  document.getElementById('btnSaveInline').onclick = () => {
    pushHistory();
    node[prop] = document.getElementById('inlineEditTextarea').value;
    modal.classList.add('hidden');
    renderNodes();
    showToast('Texto del nodo actualizado');
  };
}
export function openInlineOptionModal(node, optIdx) {
  const opt = node.options[optIdx];
  const modal = document.getElementById('drawerModal');
  document.getElementById('drawerModalTitle').textContent = `Editar opción de elección`;
  document.getElementById('drawerModalBody').innerHTML = `
    <div class="space-y-3">
      <label class="block text-xs uppercase tracking-wider text-slate-400 font-semibold">Etiqueta de la elección</label>
      <input id="inlineOptInput" type="text" value="${escapeHtml(opt.label)}" class="w-full rounded-xl bg-[#0f1428] border border-slate-600 p-3 text-sm text-white focus:border-cyan-400 outline-none" />
      <div class="flex items-center justify-between pt-2">
        <button id="btnDeleteOpt" class="px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs font-semibold text-rose-300">Eliminar opción</button>
        <div class="flex gap-2">
          <button id="btnCancelOpt" class="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancelar</button>
          <button id="btnSaveOpt" class="px-4 py-2 rounded-xl bg-cyan-500 text-xs font-bold text-slate-950">Guardar</button>
        </div>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  document.getElementById('btnCancelOpt').onclick = () => modal.classList.add('hidden');
  document.getElementById('btnDeleteOpt').onclick = () => {
    pushHistory();
    node.options.splice(optIdx, 1);
    modal.classList.add('hidden');
    renderNodes();
  };
  document.getElementById('btnSaveOpt').onclick = () => {
    pushHistory();
    opt.label = document.getElementById('inlineOptInput').value;
    modal.classList.add('hidden');
    renderNodes();
  };
}
