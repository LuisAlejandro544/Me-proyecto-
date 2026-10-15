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
  // Layout zoom (CSS `zoom` re-lays-out text/vectors: crisp at any level).
  // Pan lives on the outer #panLayer so translate px are never zoom-scaled.
  const pan = document.getElementById('panLayer');
  if (pan) pan.style.transform = `translate3d(${ctx.state.panX}px, ${ctx.state.panY}px, 0)`;
  const world = document.getElementById('canvasWorld');
  if (world) {
    world.style.transform = '';
    world.style.zoom = String(ctx.state.zoom);
  }
  const pct = `${Math.round(ctx.state.zoom * 100)}%`;
  const top = document.getElementById('topZoomLabel');
  const pill = document.getElementById('pillZoomLabel');
  const mini = document.getElementById('minimapZoomLabel');
  if (top) top.textContent = pct;
  if (pill) pill.textContent = pct;
  if (mini) mini.textContent = pct;
}
