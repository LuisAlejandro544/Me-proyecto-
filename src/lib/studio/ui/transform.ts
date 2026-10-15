// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';

export function setZoom(newZoom) {
  ctx.state.zoom = Math.round(Math.min(2.0, Math.max(0.35, newZoom)) * 100) / 100;
  applyTransform();
  // Los cables viven dentro de #canvasWorld y escalan solos con el transform:
  // no hace falta reconstruirlos al hacer zoom (solo minimapa diferido).
  updateZoomLabels();
}
export function updateZoomLabels() {
  const pct = `${Math.round(ctx.state.zoom * 100)}%`;
  const top = document.getElementById('topZoomLabel');
  const pill = document.getElementById('pillZoomLabel');
  const mini = document.getElementById('minimapZoomLabel');
  if (top) top.textContent = pct;
  if (pill) pill.textContent = pct;
  if (mini) mini.textContent = pct;
}
export function applyTransform() {
  // Zoom por GPU (transform scale): nativo y sin re-layout.
  // El pan vive en #panLayer (px de pantalla, sin escalar) y el zoom en
  // #canvasWorld (scale con origen arriba-izquierda). La matemática de
  // pantalla = mundo * zoom + pan no cambia respecto al zoom por layout,
  // pero evita el coste de CSS `zoom` (re-maquetaba todos los nodos por frame).
  // Los cables SVG están dentro del mundo y escalan vectorialmente gratis.
  const pan = document.getElementById('panLayer');
  if (pan) pan.style.transform = `translate3d(${ctx.state.panX}px, ${ctx.state.panY}px, 0)`;
  const world = document.getElementById('canvasWorld');
  if (world) {
    if ('zoom' in world.style) world.style.zoom = '';
    world.style.transformOrigin = '0 0';
    world.style.transform = `scale(${ctx.state.zoom})`;
  }
  updateZoomLabels();
}
