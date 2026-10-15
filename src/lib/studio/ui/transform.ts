// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { renderWires } from './render-wires';

export function setZoom(newZoom) {
  ctx.state.zoom = Math.round(Math.min(2.0, Math.max(0.35, newZoom)) * 100) / 100;
  applyTransform();
  renderWires();
}
export function applyTransform() {
  const world = document.getElementById('canvasWorld');
  if (!world) return;
  world.style.transform = `translate3d(${ctx.state.panX}px, ${ctx.state.panY}px, 0) scale(${ctx.state.zoom})`;
  const pct = `${Math.round(ctx.state.zoom * 100)}%`;
  const top = document.getElementById('topZoomLabel');
  const pill = document.getElementById('pillZoomLabel');
  const mini = document.getElementById('minimapZoomLabel');
  if (top) top.textContent = pct;
  if (pill) pill.textContent = pct;
  if (mini) mini.textContent = pct;
}
