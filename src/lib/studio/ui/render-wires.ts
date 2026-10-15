// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { playSynthSfx } from '../domain/audio';
import { buildBezierPath, getPortPosition } from '../domain/geometry';
import { pushHistory } from '../domain/history';
import { renderMinimap } from './minimap';
import { showToast } from './toast';

export function renderWires() {
  const wiresLayer = document.getElementById('wiresLayer');
  wiresLayer.innerHTML = '';

  ctx.state.wires.forEach(wire => {
    const p1 = getPortPosition(wire.fromNode, wire.fromPort);
    const p2 = getPortPosition(wire.toNode, wire.toPort);
    const d = buildBezierPath(p1.x, p1.y, p2.x, p2.y);
    const isCyan = wire.color === 'cyan';
    const strokeColor = isCyan ? '#00f2fe' : '#ff756b';
    const glowFilter = isCyan ? 'url(#glow-cyan)' : 'url(#glow-coral)';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'vn-wire-group');
    g.dataset.wireId = wire.id;

    // Outer soft glow path
    const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    glowPath.setAttribute('d', d);
    glowPath.setAttribute('fill', 'none');
    glowPath.setAttribute('stroke', strokeColor);
    glowPath.setAttribute('stroke-width', '6');
    glowPath.setAttribute('stroke-opacity', '0.32');
    glowPath.setAttribute('filter', glowFilter);

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
    hitPath.setAttribute('fill', 'none');
    hitPath.setAttribute('stroke', 'transparent');
    hitPath.setAttribute('stroke-width', '16');

    g.appendChild(glowPath);
    g.appendChild(corePath);
    g.appendChild(hitPath);

    g.addEventListener('click', (e) => {
      e.stopPropagation();
      pushHistory();
      if (e.shiftKey) {
        ctx.state.wires = ctx.state.wires.filter(w => w.id !== wire.id);
        showToast('Connection removed');
      } else {
        wire.color = wire.color === 'cyan' ? 'coral' : 'cyan';
        showToast(`Wire color switched to ${wire.color.toUpperCase()} (Shift+Click to delete)`);
      }
      playSynthSfx('click');
      renderWires();
      renderMinimap();
    });

    wiresLayer.appendChild(g);
  });

  renderMinimap();
}
