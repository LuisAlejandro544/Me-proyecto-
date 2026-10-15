// Pure canvas geometry (+ DOM-measured port positions). Fully typed.
import { ctx } from '../context';
import type { Point } from '../../types';

export function getPortPosition(nodeId: string, portId: string): Point {
  const node = ctx.state.nodes.find((n) => n.id === nodeId);
  if (!node) return { x: 0, y: 0 };

  // Compat: los choice antiguos tenían una entrada por opción (in_<optId>).
  // Ahora la entrada es única (in_main); los cables viejos apuntan a ella.
  let effectivePortId = portId;
  if (node.type === 'choice' && portId !== 'in_main' && portId.startsWith('in_')) {
    const single = document.querySelector(`[data-node-id="${nodeId}"][data-port-id="in_main"]`);
    if (single) effectivePortId = 'in_main';
  }

  // Check DOM element first for exact visual alignment
  const portEl = document.querySelector(`[data-node-id="${nodeId}"][data-port-id="${effectivePortId}"]`);
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
export function buildBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(Math.abs(x2 - x1) * 0.55, 60);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}
export function escapeHtml(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
