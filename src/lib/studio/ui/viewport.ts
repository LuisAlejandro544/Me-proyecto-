// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { playSynthSfx } from '../domain/audio';
import { buildBezierPath } from '../domain/geometry';
import { pushHistory } from '../domain/history';
import { renderWires } from './render-wires';
import { showToast } from './toast';
import { applyTransform, setZoom } from './transform';

export function wireCanvasPanZoom() {
const viewport = document.getElementById('canvasViewport');
if (!viewport || viewport.dataset.wired) return;
viewport.dataset.wired = '1';
viewport.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.vn-node') || e.target.closest('button')) return;
  ctx.dragState = {
    mode: 'pan',
    startX: e.clientX,
    startY: e.clientY,
    origPanX: ctx.state.panX,
    origPanY: ctx.state.panY
  };
});

window.addEventListener('pointermove', (e) => {
  if (!ctx.dragState) return;

  if (ctx.dragState.mode === 'node') {
    const dx = (e.clientX - ctx.dragState.startX) / ctx.state.zoom;
    const dy = (e.clientY - ctx.dragState.startY) / ctx.state.zoom;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) ctx.dragState.moved = true;

    const node = ctx.state.nodes.find(n => n.id === ctx.dragState.nodeId);
    if (node) {
      node.x = Math.round(ctx.dragState.origX + dx);
      node.y = Math.round(ctx.dragState.origY + dy);
      const el = document.querySelector(`.vn-node[data-node-id="${node.id}"]`);
      if (el) {
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
      }
      renderWires();
    }
  } else if (ctx.dragState.mode === 'pan') {
    ctx.state.panX = ctx.dragState.origPanX + (e.clientX - ctx.dragState.startX);
    ctx.state.panY = ctx.dragState.origPanY + (e.clientY - ctx.dragState.startY);
    applyTransform();
  } else if (ctx.dragState.mode === 'wire') {
    const worldEl = document.getElementById('canvasWorld');
    const worldRect = worldEl.getBoundingClientRect();
    const curX = (e.clientX - worldRect.left) / ctx.state.zoom;
    const curY = (e.clientY - worldRect.top) / ctx.state.zoom;
    const tempWire = document.getElementById('tempDragWire');
    tempWire.setAttribute('d', buildBezierPath(ctx.dragState.startX, ctx.dragState.startY, curX, curY));
  }
});

window.addEventListener('pointerup', (e) => {
  if (!ctx.dragState) return;

  if (ctx.dragState.mode === 'wire') {
    const tempWire = document.getElementById('tempDragWire');
    tempWire.classList.add('hidden');

    const targetPort = document.elementFromPoint(e.clientX, e.clientY)?.closest('.vn-port');
    if (targetPort && targetPort.dataset.nodeId !== ctx.dragState.fromNode) {
      pushHistory();
      ctx.state.wires.push({
        id: 'w_' + Date.now().toString(36),
        fromNode: ctx.dragState.fromNode,
        fromPort: ctx.dragState.fromPort,
        toNode: targetPort.dataset.nodeId,
        toPort: targetPort.dataset.portId,
        color: ctx.dragState.color
      });
      playSynthSfx('connect');
      renderWires();
      showToast('Nodes connected!');
    }
  } else if (ctx.dragState.mode === 'node' && ctx.dragState.moved) {
    pushHistory();
  }

  ctx.dragState = null;
});

// Wheel Zoom
viewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.06 : -0.06;
  setZoom(Math.min(1.5, Math.max(0.45, ctx.state.zoom + delta)));
}, { passive: false });
}
