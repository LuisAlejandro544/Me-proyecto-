// @ts-nocheck
// Estudio de escenas: nombre personalizable + dónde termina cada escena y
// dónde empieza la siguiente. Una decisión puede saltar directo a una escena
// con `gotoSceneId` sin necesidad de cable.
import { ctx } from '../context';
import { escapeHtml } from '../domain/geometry';
import { pushHistory } from '../domain/history';
import { renderNodes } from './render-nodes';
import { applyTransform } from './transform';
import { showToast } from './toast';
import { getStartNodeId } from '../storage';
import { renderPlaytestStep, startPlaytest } from './playtest';
import {
  createScene,
  deleteScene,
  ensureScenes,
  getSceneOfNode,
  moveScene,
  nodeLabel,
  renameScene,
  resolveSceneStartNode
} from '../domain/scenes';

function nodeOptions(selectedId?: string): string {
  const opts = ctx.state.nodes.map(
    (n) =>
      `<option value="${n.id}" ${n.id === selectedId ? 'selected' : ''}>${escapeHtml(nodeLabel(n))} (${escapeHtml(n.type)})</option>`
  );
  return `<option value="">— Sin asignar —</option>` + opts.join('');
}

function centerOnNode(nodeId?: string) {
  if (!nodeId) return;
  const node = ctx.state.nodes.find((n) => n.id === nodeId);
  if (!node) {
    showToast('Ese nodo ya no existe');
    return;
  }
  try {
    ctx.selectedNodeId = nodeId;
    ctx.state.panX = 260 - (node.x ?? 100) * ctx.state.zoom;
    ctx.state.panY = 200 - (node.y ?? 100) * ctx.state.zoom;
    applyTransform();
  } catch {}
  renderNodes();
}

export function openScenesStudio() {
  ensureScenes(ctx.state);
  const modal = document.getElementById('drawerModal');
  const titleEl = document.getElementById('drawerModalTitle');
  const bodyEl = document.getElementById('drawerModalBody');
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = 'Escenas de la historia';

  const scenes = ctx.state.scenes ?? [];
  const counts = new Map<string, number>();
  for (const n of ctx.state.nodes) {
    const owner = n.sceneId || getSceneOfNode(ctx.state, n.id)?.id;
    if (owner) counts.set(owner, (counts.get(owner) ?? 0) + 1);
  }

  bodyEl.innerHTML = `
    <div class="space-y-3">
      <p class="text-xs text-slate-400 leading-relaxed">
        Divide tu novela en <b class="text-slate-200">escenas con nombre propio</b>:
        elige en qué nodo <b class="text-amber-200">termina</b> cada escena y en qué nodo
        <b class="text-emerald-200">empieza</b> la siguiente. Al jugar, «Continuar» sin cable
        salta solo a la siguiente escena, y una <b class="text-slate-200">decisión puede ir directo</b>
        a otra escena (edita el nodo de decisión ✏️ → «Ir a escena»).
      </p>
      <button id="btnAddScene" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-xs font-bold text-slate-950 min-h-[44px]">+ Nueva escena</button>
      <div class="space-y-3">
        ${scenes
          .map(
            (s, i) => `
          <section data-scene-card="${s.id}" class="p-3.5 rounded-2xl bg-[#101528] border border-amber-400/30 space-y-2.5">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-200 text-[11px] font-bold shrink-0">${i + 1}</span>
              <input data-scene-name="${s.id}" value="${escapeHtml(s.name)}" maxlength="60" spellcheck="false"
                class="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#0f1428] border border-slate-600 text-sm font-bold text-white outline-none focus:border-amber-400" />
              <button data-scene-up="${s.id}" title="Subir orden" ${i === 0 ? 'disabled' : ''} class="w-9 h-9 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 disabled:opacity-30">▲</button>
              <button data-scene-down="${s.id}" title="Bajar orden" ${i === scenes.length - 1 ? 'disabled' : ''} class="w-9 h-9 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 disabled:opacity-30">▼</button>
              <button data-scene-del="${s.id}" title="Eliminar escena" class="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold">🗑</button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label class="block">
                <span class="block text-[11px] uppercase tracking-wider text-emerald-300 font-semibold mb-1">🎬 Empieza en el nodo…</span>
                <select data-scene-start="${s.id}" class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-2.5 py-2 text-xs text-white min-h-[44px]">${nodeOptions(s.startNodeId)}</select>
              </label>
              <label class="block">
                <span class="block text-[11px] uppercase tracking-wider text-amber-300 font-semibold mb-1">⛔ Termina en el nodo…</span>
                <select data-scene-end="${s.id}" class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-2.5 py-2 text-xs text-white min-h-[44px]">${nodeOptions(s.endNodeId)}</select>
              </label>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span class="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">${counts.get(s.id) ?? 0} nodo(s) asignados</span>
              ${s.endNodeId ? `<span class="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/40 text-amber-200">⛔ fin: ${escapeHtml(nodeLabel(ctx.state.nodes.find((n) => n.id === s.endNodeId) ?? { id: s.endNodeId } as any))}</span>` : `<span class="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">sin fin marcado</span>`}
              ${scenes[i + 1] ? `<span>→ sigue: <b class="text-slate-200">${escapeHtml(scenes[i + 1].name)}</b></span>` : `<span class="text-emerald-300">✦ última escena</span>`}
            </div>
            <div class="flex flex-wrap gap-2">
              <button data-scene-play="${s.id}" class="flex-1 px-3 py-2 rounded-xl bg-emerald-500 text-[11px] font-bold text-slate-950 min-h-[44px]">▶ Jugar desde aquí</button>
              <button data-scene-view="${s.id}" class="px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 text-[11px] font-semibold text-slate-200 min-h-[44px]">◎ Ver inicio</button>
            </div>
          </section>`
          )
          .join('')}
      </div>
      <p class="text-[11px] text-slate-500">Consejo: asigna cada nodo a su escena desde ✏️ Editar nodo → «🎬 Escena». Los cables siguen mandando: el salto de escena solo actúa cuando no hay cable de salida.</p>
    </div>`;
  modal.classList.remove('hidden');

  const reopen = () => openScenesStudio();

  (document.getElementById('btnAddScene') as HTMLElement | null)?.addEventListener('click', () => {
    pushHistory();
    const s = createScene(ctx.state);
    renderNodes();
    showToast(`Nueva escena: «${s.name}» 🎬`);
    reopen();
  });

  bodyEl.querySelectorAll('[data-scene-name]').forEach((inp) => {
    (inp as HTMLInputElement).addEventListener('change', () => {
      const id = (inp as HTMLElement).dataset.sceneName as string;
      pushHistory();
      const ok = renameScene(ctx.state, id, (inp as HTMLInputElement).value);
      if (!ok) {
        showToast('El nombre no puede quedar vacío');
        reopen();
        return;
      }
      renderNodes();
      showToast(`Escena renombrada a «${(inp as HTMLInputElement).value.trim()}» ✏️`);
    });
  });
  bodyEl.querySelectorAll('[data-scene-start]').forEach((sel) => {
    (sel as HTMLSelectElement).addEventListener('change', () => {
      const id = (sel as HTMLElement).dataset.sceneStart as string;
      pushHistory();
      const scene = (ctx.state.scenes ?? []).find((s) => s.id === id);
      if (scene) {
        scene.startNodeId = (sel as HTMLSelectElement).value || undefined;
        const node = ctx.state.nodes.find((n) => n.id === scene.startNodeId);
        if (node) node.sceneId = id;
        renderNodes();
        showToast(scene.startNodeId ? `«${scene.name}» empieza en «${nodeLabel(node)}» 🎬` : `«${scene.name}» sin inicio fijo`);
      }
      reopen();
    });
  });
  bodyEl.querySelectorAll('[data-scene-end]').forEach((sel) => {
    (sel as HTMLSelectElement).addEventListener('change', () => {
      const id = (sel as HTMLElement).dataset.sceneEnd as string;
      pushHistory();
      const scene = (ctx.state.scenes ?? []).find((s) => s.id === id);
      if (scene) {
        scene.endNodeId = (sel as HTMLSelectElement).value || undefined;
        const node = ctx.state.nodes.find((n) => n.id === scene.endNodeId);
        if (node && !node.sceneId) node.sceneId = id;
        renderNodes();
        showToast(scene.endNodeId ? `«${scene.name}» termina en «${nodeLabel(node)}» ⛔` : `«${scene.name}» sin fin marcado`);
      }
      reopen();
    });
  });
  bodyEl.querySelectorAll('[data-scene-del]').forEach((btn) => {
    (btn as HTMLElement).addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.sceneDel as string;
      const scene = (ctx.state.scenes ?? []).find((s) => s.id === id);
      if (!scene) return;
      if (!confirm(`¿Eliminar la escena «${scene.name}»? Sus nodos pasan a la primera escena.`)) return;
      pushHistory();
      deleteScene(ctx.state, id);
      renderNodes();
      showToast(`Escena «${scene.name}» eliminada 🗑`);
      reopen();
    });
  });
  bodyEl.querySelectorAll('[data-scene-up]').forEach((btn) => {
    (btn as HTMLElement).addEventListener('click', () => {
      pushHistory();
      moveScene(ctx.state, (btn as HTMLElement).dataset.sceneUp as string, -1);
      renderNodes();
      reopen();
    });
  });
  bodyEl.querySelectorAll('[data-scene-down]').forEach((btn) => {
    (btn as HTMLElement).addEventListener('click', () => {
      pushHistory();
      moveScene(ctx.state, (btn as HTMLElement).dataset.sceneDown as string, 1);
      renderNodes();
      reopen();
    });
  });
  bodyEl.querySelectorAll('[data-scene-view]').forEach((btn) => {
    (btn as HTMLElement).addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.sceneView as string;
      const target = resolveSceneStartNode(ctx.state, id) || getStartNodeId(ctx.state);
      try {
        (document.getElementById('drawerModal') as HTMLElement)?.classList.add('hidden');
      } catch {}
      centerOnNode(target);
    });
  });
  bodyEl.querySelectorAll('[data-scene-play]').forEach((btn) => {
    (btn as HTMLElement).addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.scenePlay as string;
      const target = resolveSceneStartNode(ctx.state, id);
      if (!target) {
        showToast('Esta escena aún no tiene nodo de inicio');
        return;
      }
      try {
        (document.getElementById('drawerModal') as HTMLElement)?.classList.add('hidden');
      } catch {}
      startPlaytest();
      renderPlaytestStep(target);
      showToast(`Jugando «${(ctx.state.scenes ?? []).find((s) => s.id === id)?.name}» 🎬`);
    });
  });
}
