// @ts-nocheck
// Node-editor: borrar y duplicar (extraído de ui/node-editor.ts — barrel en ui/node-editor.ts).
import { ctx } from '../../context';
import { pushHistory } from '../../domain/history';
import { renderNodes } from '../render-nodes';
import { showToast } from '../toast';
export function deleteNode(nodeId: string) {
  const node = ctx.state.nodes.find((n) => n.id === nodeId);
  if (!node) return;
  pushHistory();
  ctx.state.nodes = ctx.state.nodes.filter((n) => n.id !== nodeId);
  const removedWires = ctx.state.wires.filter((w) => w.fromNode === nodeId || w.toNode === nodeId).length;
  ctx.state.wires = ctx.state.wires.filter((w) => w.fromNode !== nodeId && w.toNode !== nodeId);
  if ((ctx.state as { startNodeId?: string }).startNodeId === nodeId) {
    (ctx.state as { startNodeId?: string }).startNodeId = ctx.state.nodes[0]?.id ?? '';
    showToast('El nodo inicial se movió al primer nodo ▶');
  }
  try {
    for (const s of ctx.state.scenes ?? []) {
      if (s.startNodeId === nodeId) s.startNodeId = undefined;
      if (s.endNodeId === nodeId) s.endNodeId = undefined;
    }
  } catch {}
  if (ctx.selectedNodeId === nodeId) {
    ctx.selectedNodeId = ctx.state.nodes[0]?.id ?? '';
  }
  document.getElementById('drawerModal')?.classList.add('hidden');
  renderNodes();
  showToast(`Nodo eliminado (${removedWires} conexión(es) retirada(s))`);
}

export function duplicateNode(nodeId: string) {
  const node = ctx.state.nodes.find((n) => n.id === nodeId);
  if (!node) return;
  pushHistory();
  const copy = JSON.parse(JSON.stringify(node));
  copy.id = 'node_' + Date.now().toString(36);
  copy.x = (node.x ?? 100) + 40;
  copy.y = (node.y ?? 100) + 40;
  if (copy.badge) copy.badge = `${copy.badge} (copia)`;
  if (copy.title) copy.title = `${copy.title} (copia)`;
  ctx.state.nodes.push(copy);
  ctx.selectedNodeId = copy.id;
  document.getElementById('drawerModal')?.classList.add('hidden');
  renderNodes();
  showToast('Nodo duplicado');
}

