// @ts-nocheck
// Tarjetas: toolbar + estilo de texto (extraído de ui/render-nodes.ts — orquestador en ui/render-nodes.ts).
import { escapeHtml } from '../../domain/geometry';
export function applyTextStyle(el: HTMLElement, node) {
  if (node.dialogueSize != null || node.rotation || (node.textScale && node.textScale !== 1)) {
    el.dataset.txtStyled = '1';
    if (node.dialogueSize != null) el.style.setProperty('--dlg-size', `${node.dialogueSize}px`);
    if (node.textScale && node.textScale !== 1) el.style.setProperty('--dlg-scale', String(node.textScale));
    if (node.rotation) el.style.setProperty('--dlg-rot', `${node.rotation}deg`);
  }
}
export function buildToolbar(node, isStart: boolean): string {
  const hasCustomAnim = !!(node.assetEnter || node.assetMotion || node.sceneTransition);
  const animTag = hasCustomAnim
    ? `<div class="vn-anim-tag" title="Aparición: ${escapeHtml(node.assetEnter ?? 'global')} · Movimiento: ${escapeHtml(node.assetMotion ?? 'global')} · Transición: ${escapeHtml(node.sceneTransition ?? 'escena/global')}">🎞 ${escapeHtml([node.assetEnter, node.assetMotion, node.sceneTransition].filter(Boolean).join(' · ') || 'animado')}</div>`
    : '';
  return `
      <div class="vn-node-toolbar" role="toolbar" aria-label="Acciones del nodo">
        <button data-action="edit-node" data-node="${node.id}" title="Editar nodo (pregunta, personaje…)" aria-label="Editar nodo"
          class="vn-node-btn vn-node-btn-edit">✏️</button>
        <button data-action="set-start" data-node="${node.id}" title="Marcar como nodo inicial de la partida" aria-label="Marcar como nodo inicial"
          class="vn-node-btn vn-node-btn-start ${isStart ? 'vn-node-btn-start-active' : ''}">${isStart ? '🟢' : '▶'}</button>
        <button data-action="delete-node" data-node="${node.id}" title="Eliminar nodo" aria-label="Eliminar nodo"
          class="vn-node-btn vn-node-btn-delete">🗑</button>
      </div>
      ${isStart ? `<div class="vn-start-badge" title="La partida empieza aquí">▶ INICIO</div>` : ''}
      ${animTag}
    `;
}
