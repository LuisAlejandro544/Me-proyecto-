// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';

export function getPortPosition(nodeId, portId) {
  const node = ctx.state.nodes.find(n => n.id === nodeId);
  if (!node) return { x: 0, y: 0 };

  // Check DOM element first for exact visual alignment
  const portEl = document.querySelector(`[data-node-id="${nodeId}"][data-port-id="${portId}"]`);
  const worldEl = document.getElementById('canvasWorld');
  if (portEl && worldEl) {
    const portRect = portEl.getBoundingClientRect();
    const worldRect = worldEl.getBoundingClientRect();
    const x = (portRect.left + portRect.width / 2 - worldRect.left) / ctx.state.zoom;
    const y = (portRect.top + portRect.height / 2 - worldRect.top) / ctx.state.zoom;
    return { x, y };
  }

  // Fallback geometric calculation
  const isInput = portId.startsWith('in_');
  return {
    x: isInput ? node.x : node.x + (node.width || 240),
    y: node.y + 80
  };
}
export function buildBezierPath(x1, y1, x2, y2) {
  const dx = Math.max(Math.abs(x2 - x1) * 0.55, 60);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}
export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
