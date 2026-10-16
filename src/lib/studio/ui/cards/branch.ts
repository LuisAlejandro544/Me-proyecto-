// @ts-nocheck
// Tarjeta branch_scene (extraído de ui/render-nodes.ts — orquestador en ui/render-nodes.ts).
import { escapeHtml } from '../../domain/geometry';
import { findCustomAsset, getCharacterCatalog, resolveCharacter } from '../../../assets';
export function renderBranchCard(node): string {
  const charObj = resolveCharacter(node.characterId);
  const video = findCustomAsset(node.videoAssetId);
  const sound = findCustomAsset(node.soundAssetId || node.audioAssetId);
  const charKeys = Object.keys(getCharacterCatalog());
  const selChar = resolveCharacter(node.selectedCharId);
  return `
        <div class="relative overflow-visible vn-node-pad-ports">
          <!-- Input Port -->
          <div class="vn-port ${node.inColor === 'coral' ? 'vn-port-ring-coral' : 'vn-port-ring-cyan'} vn-port-in"
               style="left: -9px; top: 62px;"
                data-node-id="${node.id}"
                data-port-id="in_main"
                data-port-dir="in"
                data-port-color="${node.inColor || 'cyan'}"></div>

          <div class="px-3.5 py-2 border-b border-slate-700/70 text-xs font-bold text-white editable-field" data-field="headerBar">
            ${escapeHtml(node.headerBar || 'Rama de escena')}
          </div>

          <div class="p-3.5 flex items-center gap-3">
            <img src="${charObj.avatar}" data-action="cycle-char" data-node="${node.id}" class="w-12 h-12 rounded-xl object-cover border border-white/20 cursor-pointer shrink-0" />
            <div class="text-xs text-slate-100 leading-snug editable-field" data-field="dialogue">${escapeHtml(node.dialogue)}</div>
          </div>

          <!-- Output Port -->
          <div class="vn-port vn-port-ring-cyan vn-port-out"
               style="right: -9px; top: 62px;"
                data-node-id="${node.id}"
                data-port-id="out_main"
                data-port-dir="out"
                data-port-color="cyan"></div>
        </div>
      `;
}
