// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { playSynthSfx } from '../domain/audio';
import { buildBezierPath, getPortPosition } from '../domain/geometry';
import { pushHistory } from '../domain/history';
import { openInlineEditorModal, openInlineOptionModal } from './editors';
import { deleteNode, duplicateNode, openNodeEditor } from './node-editor';
import { renderNodes } from './render-nodes';
import { showToast } from './toast';
import { getCharacterCatalog } from '../../assets';

export function attachNodeInteractions() {
  // Node selection & drag start (touch: single-finger drag, capture pointer for fluid move)
  document.querySelectorAll('.vn-node').forEach(nodeEl => {
    nodeEl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.vn-port') || e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) {
        return;
      }
      // Ignore second finger landing on a node while already dragging/panning.
      if (ctx.dragState && (ctx.dragState.mode === 'node' || ctx.dragState.mode === 'wire' || ctx.dragState.mode === 'pan' || ctx.dragState.mode === 'pinch')) return;
      e.stopPropagation();
      try { nodeEl.setPointerCapture(e.pointerId); } catch {}
      const nodeId = nodeEl.dataset.nodeId;
      ctx.selectedNodeId = nodeId;
      document.querySelectorAll('.vn-node').forEach(n => n.classList.toggle('selected', n.dataset.nodeId === nodeId));

      const node = ctx.state.nodes.find(n => n.id === nodeId);
      if (!node) return;

      ctx.dragState = {
        mode: 'node',
        nodeId,
        pointerId: e.pointerId,
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
      if (ctx.dragState) return;
      try { portEl.setPointerCapture(e.pointerId); } catch {}
      const nodeId = portEl.dataset.nodeId;
      const portId = portEl.dataset.portId;
      const color = portEl.dataset.portColor || 'cyan';
      const startPos = getPortPosition(nodeId, portId);

      ctx.dragState = {
        mode: 'wire',
        pointerId: e.pointerId,
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

  // Double-click text fields to edit inline (desktop).
  // En táctil el doble-tap se detecta manualmente porque `dblclick` no siempre llega.
  let lastFieldTap = { key: '', t: 0 };
  function fieldActivated(fieldEl: Element, kind: 'field' | 'option') {
    const nodeEl = fieldEl.closest('.vn-node');
    const node = ctx.state.nodes.find(n => n.id === nodeEl?.dataset.nodeId);
    if (!node) return;
    if (kind === 'field') {
      const prop = (fieldEl as HTMLElement).dataset.field;
      if (!prop) return;
      openInlineEditorModal(node, prop, fieldEl.textContent);
    } else {
      const idx = parseInt((fieldEl as HTMLElement).dataset.optIdx || '-1', 10);
      if (!node.options || !node.options[idx]) return;
      openInlineOptionModal(node, idx);
    }
  }
  document.querySelectorAll('.editable-field').forEach(fieldEl => {
    fieldEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      fieldActivated(fieldEl, 'field');
    });
    fieldEl.addEventListener('click', (e) => {
      if (e.detail > 1) return; // el dblclick ya lo gestiona en desktop
      const nodeEl = fieldEl.closest('.vn-node');
      const key = `${nodeEl?.dataset.nodeId}:${(fieldEl as HTMLElement).dataset.field}`;
      const now = performance.now();
      if (lastFieldTap.key === key && now - lastFieldTap.t < 350) {
        e.stopPropagation();
        lastFieldTap = { key: '', t: 0 };
        fieldActivated(fieldEl, 'field');
      } else {
        lastFieldTap = { key, t: now };
      }
    });
  });

  document.querySelectorAll('.editable-option').forEach(optEl => {
    optEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      fieldActivated(optEl, 'option');
    });
    optEl.addEventListener('click', (e) => {
      if (e.detail > 1) return;
      const nodeEl = optEl.closest('.vn-node');
      const key = `${nodeEl?.dataset.nodeId}:opt:${(optEl as HTMLElement).dataset.optIdx}`;
      const now = performance.now();
      if (lastFieldTap.key === key && now - lastFieldTap.t < 350) {
        e.stopPropagation();
        lastFieldTap = { key: '', t: 0 };
        fieldActivated(optEl, 'option');
      } else {
        lastFieldTap = { key, t: now };
      }
    });
  });

  // Node internal buttons & sliders
  document.querySelectorAll('[data-action]').forEach(ctrl => {
    const action = ctrl.dataset.action;
    const nodeId = ctrl.dataset.node;
    const node = ctx.state.nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (action === 'edit-node') {
      ctrl.addEventListener('click', (e) => {
        e.stopPropagation();
        playSynthSfx('click');
        openNodeEditor(nodeId);
      });
    } else if (action === 'delete-node') {
      ctrl.addEventListener('click', (e) => {
        e.stopPropagation();
        playSynthSfx('click');
        if (confirm(`¿Eliminar este nodo y sus conexiones?`)) deleteNode(nodeId);
        else {
          // Sin confirmación accidental: al menos selecciona el nodo.
          ctx.selectedNodeId = nodeId;
          renderNodes();
        }
      });
    } else if (action === 'duplicate-node') {
      ctrl.addEventListener('click', (e) => {
        e.stopPropagation();
        duplicateNode(nodeId);
      });
    } else if (action === 'cycle-char') {
      ctrl.addEventListener('click', (e) => {
        e.stopPropagation();
        pushHistory();
        const catalog = getCharacterCatalog();
        const keys = Object.keys(catalog);
        const nextIdx = (keys.indexOf(node.characterId) + 1) % keys.length;
        node.characterId = keys[nextIdx];
        node.speaker = catalog[node.characterId].name;
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
          label: `Opción ${nextNum}: «Rama nueva»`,
          style: nextNum % 2 === 0 ? 'teal' : 'coral',
          inColor: 'cyan',
          outColor: nextNum % 2 === 0 ? 'cyan' : 'coral'
        });
        playSynthSfx('click');
        renderNodes();
        showToast('Nueva opción de elección añadida');
      });
    } else if (action === 'select-char') {
      ctrl.addEventListener('click', (e) => {
        e.stopPropagation();
        pushHistory();
        const charKey = ctrl.dataset.char;
        node.selectedCharId = charKey;
        node.expression = getCharacterCatalog()[charKey].expressions[0];
        playSynthSfx('click');
        renderNodes();
      });
    } else if (action === 'char-prev' || action === 'char-next') {
      ctrl.addEventListener('click', (e) => {
        e.stopPropagation();
        const keys = Object.keys(getCharacterCatalog());
        const cur = keys.indexOf(node.selectedCharId || 'yuki');
        const next = action === 'char-next' ? (cur + 1) % keys.length : (cur - 1 + keys.length) % keys.length;
        node.selectedCharId = keys[next];
        node.expression = getCharacterCatalog()[keys[next]].expressions[0];
        playSynthSfx('click');
        renderNodes();
      });
    } else if (action === 'change-expr') {
      ctrl.addEventListener('change', (e) => {
        node.expression = e.target.value;
        playSynthSfx('click');
        showToast(`Expresión: ${node.expression}`);
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
