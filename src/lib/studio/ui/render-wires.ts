// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { playSynthSfx } from '../domain/audio';
import { buildBezierPath, getPortPosition } from '../domain/geometry';
import { pushHistory } from '../domain/history';
import { renderMinimap } from './minimap';
import { showToast } from './toast';

function ensureWirePopover() {
  let pop = document.getElementById('wirePopover');
  if (pop) return pop;
  pop = document.createElement('div');
  pop.id = 'wirePopover';
  pop.className =
    'wire-pop-hidden fixed z-[70] -translate-x-1/2 flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-[#18203c]/95 backdrop-blur-md border border-cyan-400/50 shadow-2xl';
  pop.innerHTML = `
    <span id="wirePopLabel" class="hidden sm:inline text-[11px] text-slate-300 px-1">Conexión</span>
    <button id="wirePopDelete" class="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-xs font-bold text-white transition">Quitar</button>
    <button id="wirePopColor" title="Cambiar color" class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-cyan-200 transition">Color</button>
    <button id="wirePopClose" title="Cerrar" class="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition font-bold">×</button>
  `;
  document.body.appendChild(pop);

  pop.addEventListener('pointerdown', (e) => e.stopPropagation());
  pop.addEventListener('click', (e) => e.stopPropagation());

  document.getElementById('wirePopDelete').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteSelectedWire();
  });
  document.getElementById('wirePopColor').addEventListener('click', (e) => {
    e.stopPropagation();
    cycleSelectedWireColor();
  });
  document.getElementById('wirePopClose').addEventListener('click', (e) => {
    e.stopPropagation();
    clearWireSelection();
  });
  return pop;
}

function isCoarsePointer() {
  try {
    return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

let minimapRaf = 0;
export function scheduleMinimap() {
  if (minimapRaf) return;
  minimapRaf = requestAnimationFrame(() => {
    minimapRaf = 0;
    renderMinimap();
  });
}

function positionWirePopover(clientX, clientY) {
  const pop = ensureWirePopover();
  const x = Math.min(Math.max(clientX, 130), window.innerWidth - 130);
  const y = Math.max(clientY - 12, 70);
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
  pop.style.transform = 'translate(-50%, -100%)';
  pop.classList.remove('wire-pop-hidden');
}

export function clearWireSelection() {
  ctx.selectedWireId = null;
  document.querySelectorAll('.vn-wire-group.wire-selected').forEach((g) => g.classList.remove('wire-selected'));
  const pop = document.getElementById('wirePopover');
  if (pop) pop.classList.add('wire-pop-hidden');
}

export function deleteSelectedWire() {
  const id = ctx.selectedWireId;
  if (!id) return;
  pushHistory();
  ctx.state.wires = ctx.state.wires.filter((w) => w.id !== id);
  playSynthSfx('click');
  clearWireSelection();
  renderWires();
  scheduleMinimap();
  showToast('Conexión eliminada');
}

export function cycleSelectedWireColor() {
  const wire = ctx.state.wires.find((w) => w.id === ctx.selectedWireId);
  if (!wire) return;
  pushHistory();
  wire.color = wire.color === 'cyan' ? 'coral' : 'cyan';
  playSynthSfx('click');
  renderWires();
  showToast(wire.color === 'cyan' ? 'Cable cambiado a cian' : 'Cable cambiado a coral');
  // Mantiene la selección y el popover abierto.
  const g = document.querySelector(`.vn-wire-group[data-wire-id="${wire.id}"]`);
  if (g) g.classList.add('wire-selected');
}

export function renderWires(opts) {
  const wiresLayer = document.getElementById('wiresLayer');
  if (!wiresLayer) return;
  const skipMinimap = opts && opts.minimap === false;
  const coarse = isCoarsePointer();
  const frag = document.createDocumentFragment();
  wiresLayer.innerHTML = '';

  ctx.state.wires.forEach(wire => {
    const p1 = getPortPosition(wire.fromNode, wire.fromPort);
    const p2 = getPortPosition(wire.toNode, wire.toPort);
    const d = buildBezierPath(p1.x, p1.y, p2.x, p2.y);
    const isCyan = wire.color === 'cyan';
    const strokeColor = isCyan ? '#00f2fe' : '#ff756b';
    const glowFilter = isCyan ? 'url(#glow-cyan)' : 'url(#glow-coral)';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'vn-wire-group' + (ctx.selectedWireId === wire.id ? ' wire-selected' : ''));
    g.dataset.wireId = wire.id;

    // Outer soft glow path (sin filtro gaussiano en táctil: el blur por
    // cable es lo que más GPU come en móvil; se deja halo simple).
    const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    glowPath.setAttribute('d', d);
    glowPath.setAttribute('class', 'vn-wire-glow');
    glowPath.setAttribute('fill', 'none');
    glowPath.setAttribute('stroke', strokeColor);
    glowPath.setAttribute('stroke-width', '6');
    glowPath.setAttribute('stroke-opacity', coarse ? '0.18' : '0.32');
    if (!coarse) glowPath.setAttribute('filter', glowFilter);

    // Core neon wire path
    const corePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    corePath.setAttribute('d', d);
    corePath.setAttribute('class', 'vn-wire-core transition-all');
    corePath.setAttribute('fill', 'none');
    corePath.setAttribute('stroke', strokeColor);
    corePath.setAttribute('stroke-width', '3');
    corePath.setAttribute('stroke-linecap', 'round');

    // Invisible thicker hit area for clicking wire to toggle color or delete
    const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hitPath.setAttribute('d', d);
    hitPath.setAttribute('class', 'vn-wire-hit');
    hitPath.setAttribute('fill', 'none');
    hitPath.setAttribute('stroke', 'transparent');
    hitPath.setAttribute('stroke-width', '22');

    g.appendChild(glowPath);
    g.appendChild(corePath);
    g.appendChild(hitPath);

    const selectWire = (e) => {
      e.stopPropagation();
      ctx.selectedWireId = wire.id;
      document.querySelectorAll('.vn-wire-group.wire-selected').forEach((el) => {
        if (el !== g) el.classList.remove('wire-selected');
      });
      g.classList.add('wire-selected');
      playSynthSfx('click');
      positionWirePopover(e.clientX, e.clientY);
      showToast('Toca «Quitar» para eliminar la conexión');
    };

    g.addEventListener('click', (e) => {
      e.stopPropagation();
      // Shift+Clic = borrado rápido (atajo de escritorio).
      if (e.shiftKey) {
        ctx.selectedWireId = wire.id;
        deleteSelectedWire();
        return;
      }
      selectWire(e);
    });

    g.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      e.preventDefault();
      ctx.selectedWireId = wire.id;
      deleteSelectedWire();
    });

    frag.appendChild(g);
  });
  wiresLayer.appendChild(frag);

  // Clic en el lienzo vacío o Escape quita la selección.
  const viewport = document.getElementById('canvasViewport');
  if (viewport && !viewport.dataset.wireDeselectWired) {
    viewport.dataset.wireDeselectWired = '1';
    viewport.addEventListener('pointerdown', () => {
      if (ctx.selectedWireId) clearWireSelection();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') clearWireSelection();
    });
  }

  if (!skipMinimap) scheduleMinimap();
}

/**
 * Vía rápida para arrastrar nodos: actualiza solo el atributo `d` de los
 * cables existentes (o de un nodo) sin reconstruir el DOM ni re-anexar
 * listeners. Es lo que mantiene 60fps en móvil durante el drag.
 */
export function updateWirePaths(onlyNodeId) {
  const wiresLayer = document.getElementById('wiresLayer');
  if (!wiresLayer) return;
  const groups = wiresLayer.querySelectorAll('.vn-wire-group');
  if (!groups.length) return;
  const byId = new Map(ctx.state.wires.map((w) => [w.id, w]));
  groups.forEach((g) => {
    const wire = byId.get(g.dataset.wireId);
    if (!wire) return;
    if (onlyNodeId && wire.fromNode !== onlyNodeId && wire.toNode !== onlyNodeId) return;
    const p1 = getPortPosition(wire.fromNode, wire.fromPort);
    const p2 = getPortPosition(wire.toNode, wire.toPort);
    const d = buildBezierPath(p1.x, p1.y, p2.x, p2.y);
    const paths = g.querySelectorAll('path');
    paths.forEach((p) => p.setAttribute('d', d));
  });
}
