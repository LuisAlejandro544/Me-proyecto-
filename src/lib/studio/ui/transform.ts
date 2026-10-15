// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { renderWires } from './render-wires';

export function setZoom(newZoom) {
  ctx.state.zoom = Math.round(newZoom * 100) / 100;
  applyTransform();
  renderWires();
}
export function applyTransform() {
  const world = document.getElementById('canvasWorld');
  world.style.transform = `translate(${ctx.state.panX}px, ${ctx.state.panY}px) scale(${ctx.state.zoom})`;
  const pct = `${Math.round(ctx.state.zoom * 100)}%`;
  document.getElementById('topZoomLabel').textContent = pct;
  document.getElementById('pillZoomLabel').textContent = pct;
  document.getElementById('minimapZoomLabel').textContent = pct;
}
