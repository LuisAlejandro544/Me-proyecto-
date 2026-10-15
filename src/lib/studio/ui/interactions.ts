// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { CHARACTER_ASSETS } from '../data/assets';
import { playSynthSfx } from '../domain/audio';
import { buildBezierPath, getPortPosition } from '../domain/geometry';
import { pushHistory } from '../domain/history';
import { openInlineEditorModal, openInlineOptionModal } from './editors';
import { renderNodes } from './render-nodes';
import { showToast } from './toast';

export function attachNodeInteractions() {
  // Node selection & drag start
  document.querySelectorAll('.vn-node').forEach(nodeEl => {
    nodeEl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.vn-port') || e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) {
        return;
      }
      e.stopPropagation();
      const nodeId = nodeEl.dataset.nodeId;
      ctx.selectedNodeId = nodeId;
      document.querySelectorAll('.vn-node').forEach(n => n.classList.toggle('selected', n.dataset.nodeId === nodeId));

      const node = ctx.state.nodes.find(n => n.id === nodeId);
      if (!node) return;

      ctx.dragState = {
        mode: 'node',
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        origX: node.x,
        origY: node.y,
        moved: false
      };
    });
  });

  // Port drag to create new connection wire
  document.querySelectorAll('.vn-port').forEach(portEl => {
    portEl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const nodeId = portEl.dataset.nodeId;
      const portId = portEl.dataset.portId;
      const color = portEl.dataset.portColor || 'cyan';
      const startPos = getPortPosition(nodeId, portId);

      ctx.dragState = {
        mode: 'wire',
        fromNode: nodeId,
        fromPort: portId,
        color,
        startX: startPos.x,
        startY: startPos.y
      };

      const tempWire = document.getElementById('tempDragWire');
      tempWire.setAttribute('stroke', color === 'coral' ? '#ff756b' : '#00f2fe');
      tempWire.setAttribute('filter', color === 'coral' ? 'url(#glow-coral)' : 'url(#glow-cyan)');
      tempWire.classList.remove('hidden');
      tempWire.setAttribute('d', buildBezierPath(startPos.x, startPos.y, startPos.x + 10, startPos.y));
    });
  });

  // Double-click text fields to edit inline
  document.querySelectorAll('.editable-field').forEach(fieldEl => {
    fieldEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const nodeEl = fieldEl.closest('.vn-node');
      const node = ctx.state.nodes.find(n => n.id === nodeEl?.dataset.nodeId);
      const prop = fieldEl.dataset.field;
      if (!node || !prop) return;
      openInlineEditorModal(node, prop, fieldEl.textContent);
    });
  });

  document.querySelectorAll('.editable-option').forEach(optEl => {
    optEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const nodeEl = optEl.closest('.vn-node');
      const node = ctx.state.nodes.find(n => n.id === nodeEl?.dataset.nodeId);
      const idx = parseInt(optEl.dataset.optIdx, 10);
      if (!node || !node.options || !node.options[idx]) return;
      openInlineOptionModal(node, idx);
    });
  });

  // Node internal buttons & sliders
  document.querySelectorAll('[data-action]').forEach(ctrl => {
    const action = ctrl.dataset.action;
    const nodeId = ctrl.dataset.node;
    const node = ctx.state.nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (action === 'cycle-char') {
      ctrl.addEventListener('click', (e) => {
        e.stopPropagation();
        pushHistory();
        const keys = Object.keys(CHARACTER_ASSETS);
        const nextIdx = (keys.indexOf(node.characterId) + 1) % keys.length;
        node.characterId = keys[nextIdx];
        node.speaker = CHARACTER_ASSETS[node.characterId].name;
        playSynthSfx('click');
        renderNodes();
      });
    } else if (action === 'add-choice-opt') {
      ctrl.addEventListener('click', (e) => {
        e.stopPropagation();
        pushHistory();
        const nextNum = (node.options?.length || 0) + 1;
        const optId = 'opt_' + Date.now().toString(36);
        node.options.push({
          id: optId,
          label: `Option ${nextNum}: "New branch"`,
          style: nextNum % 2 === 0 ? 'teal' : 'coral',
          inColor: 'cyan',
          outColor: nextNum % 2 === 0 ? 'cyan' : 'coral'
        });
        playSynthSfx('click');
        renderNodes();
        showToast('Added new choice option');
      });
    } else if (action === 'select-char') {
      ctrl.addEventListener('click', (e) => {
        e.stopPropagation();
        pushHistory();
        const charKey = ctrl.dataset.char;
        node.selectedCharId = charKey;
        node.expression = CHARACTER_ASSETS[charKey].expressions[0];
        playSynthSfx('click');
        renderNodes();
      });
    } else if (action === 'char-prev' || action === 'char-next') {
      ctrl.addEventListener('click', (e) => {
        e.stopPropagation();
        const keys = Object.keys(CHARACTER_ASSETS);
        const cur = keys.indexOf(node.selectedCharId || 'yuki');
        const next = action === 'char-next' ? (cur + 1) % keys.length : (cur - 1 + keys.length) % keys.length;
        node.selectedCharId = keys[next];
        node.expression = CHARACTER_ASSETS[keys[next]].expressions[0];
        playSynthSfx('click');
        renderNodes();
      });
    } else if (action === 'change-expr') {
      ctrl.addEventListener('change', (e) => {
        node.expression = e.target.value;
        playSynthSfx('click');
        showToast(`Expression set to ${node.expression}`);
      });
    } else if (action === 'slider-scale') {
      ctrl.addEventListener('input', (e) => {
        node.scale = parseInt(e.target.value, 10);
        const lbl = document.getElementById(`scaleVal_${node.id}`);
        if (lbl) lbl.textContent = `${node.scale}%`;
      });
    } else if (action === 'slider-pos') {
      ctrl.addEventListener('input', (e) => {
        node.position = parseInt(e.target.value, 10);
        const lbl = document.getElementById(`posVal_${node.id}`);
        if (lbl) lbl.textContent = `${node.position}%`;
      });
    }
  });
}
