// @ts-nocheck
// Workspace: pestaña variables/timeline (extraído de ui/workspace.ts — barrel en ui/workspace.ts).
import { ctx } from '../../context';
import { animateTabSwitch } from './tab-switch';
import { escapeHtml } from '../../domain/geometry';
import { showToast } from '../toast';

export function renderTimelineTab(modal: HTMLElement, titleEl: HTMLElement, bodyEl: HTMLElement, reopen: (t: string) => void, tabName: string) {
    titleEl.textContent = 'Variables de historia y estado de ramificaciones';
    bodyEl.innerHTML = `
      <div class="space-y-3">
        <div class="text-xs text-slate-400">Controla banderas, puntos de afecto y objetos del inventario entre ramas:</div>
        <div id="varsListContainer" class="space-y-2">
          ${Object.entries(ctx.state.variables || {}).map(([k, v]) => `
            <div class="vn-anim-card flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#101528] border border-slate-700">
              <span class="font-mono text-xs text-cyan-300">${escapeHtml(k)}</span>
              <input data-var-key="${escapeHtml(k)}" value="${escapeHtml(String(v))}" class="w-28 px-2 py-1 rounded bg-slate-800 text-xs text-right text-white border border-slate-600" />
            </div>
          `).join('')}
        </div>
        <div class="flex gap-2 pt-2">
          <input id="newVarName" placeholder="nombre_variable" class="flex-1 px-3 py-2 rounded-xl bg-[#101528] border border-slate-700 text-xs text-white" />
          <input id="newVarVal" placeholder="true / 10" class="w-28 px-3 py-2 rounded-xl bg-[#101528] border border-slate-700 text-xs text-white" />
          <button id="btnAddVar" class="px-4 py-2 rounded-xl bg-cyan-500 text-xs font-bold text-slate-950 min-h-[44px]">+ Añadir</button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
    animateTabSwitch(tabName);
    bodyEl.querySelectorAll('[data-var-key]').forEach(inp => {
      inp.onchange = () => {
        ctx.state.variables[inp.dataset.varKey] = inp.value;
        showToast(`«${inp.dataset.varKey}» actualizada`);
      };
    });
    document.getElementById('btnAddVar').onclick = () => {
      const k = document.getElementById('newVarName').value.trim();
      const v = document.getElementById('newVarVal').value.trim() || 'true';
      if (k) {
        ctx.state.variables[k] = v;
        reopen('timeline');
      }
    };
  
}
