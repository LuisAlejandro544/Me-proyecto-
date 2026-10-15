// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { buildBezierPath } from '../domain/geometry';

export function renderMinimap() {
  const svg = document.getElementById('minimapSvg');
  if (!svg) return;
  // En móvil el minimapa está oculto (hidden sm:flex): no gastar CPU.
  try {
    if (!svg.offsetParent && window.innerWidth < 640) return;
  } catch {}
  let html = '';

  // Draw wires in minimap
  ctx.state.wires.forEach(w => {
    const n1 = ctx.state.nodes.find(n => n.id === w.fromNode);
    const n2 = ctx.state.nodes.find(n => n.id === w.toNode);
    if (!n1 || !n2) return;
    const x1 = n1.x + (n1.width || 220);
    const y1 = n1.y + 70;
    const x2 = n2.x;
    const y2 = n2.y + 70;
    const stroke = w.color === 'coral' ? '#ff756b' : '#00f2fe';
    html += `<path d="${buildBezierPath(x1, y1, x2, y2)}" fill="none" stroke="${stroke}" stroke-width="14" />`;
  });

  // Draw node rectangles in minimap
  ctx.state.nodes.forEach(n => {
    const fill = n.type === 'choice' ? '#334155' : '#38bdf8';
    html += `<rect x="${n.x}" y="${n.y}" width="${n.width || 220}" height="130" rx="20" fill="${fill}" fill-opacity="0.65" stroke="#94a3b8" stroke-width="6" />`;
  });

  svg.innerHTML = html;
}
