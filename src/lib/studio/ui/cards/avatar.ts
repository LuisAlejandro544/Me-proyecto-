// @ts-nocheck
// Tarjeta avatar_scene (extraído de ui/render-nodes.ts — orquestador en ui/render-nodes.ts).
import { escapeHtml } from '../../domain/geometry';
import { findCustomAsset, getCharacterCatalog, resolveCharacter } from '../../../assets';
export function renderAvatarCard(node): string {
  const charObj = resolveCharacter(node.characterId);
  const video = findCustomAsset(node.videoAssetId);
  const sound = findCustomAsset(node.soundAssetId || node.audioAssetId);
  const charKeys = Object.keys(getCharacterCatalog());
  const selChar = resolveCharacter(node.selectedCharId);
  const avatarHtml = charObj?.avatar
    ? `<img src="${charObj.avatar}" data-action="cycle-char" data-node="${node.id}" title="Clic para cambiar de personaje" class="w-12 h-12 rounded-xl object-cover border border-white/20 cursor-pointer" />`
    : `<div data-action="cycle-char" data-node="${node.id}" title="Toca para elegir personaje" class="w-12 h-12 rounded-xl bg-slate-800 border border-dashed border-slate-600 flex items-center justify-center text-xl cursor-pointer shrink-0">🎭</div>`;
  return `
        <div class="relative vn-node-pad-ports">
          <!-- Input Port (permite encadenar escenas) -->
          <div class="vn-port vn-port-cyan vn-port-in"
               style="left: -9px; top: 26px;"
               data-node-id="${node.id}"
               data-port-id="in_main"
               data-port-dir="in"
               data-port-color="cyan"></div>
          ${node.topTitle ? `
            <div class=" -top-11 left-0.5 mb-1.5 px-3 pt-2.5">
              <div class="text-sm font-bold text-white editable-field" data-field="topTitle">${escapeHtml(node.topTitle)}</div>
              <div class="text-[11px] text-slate-400 editable-field" data-field="topSubtitle">${escapeHtml(node.topSubtitle || 'Start')}</div>
            </div>
          ` : ''}
          <div class="p-3 pt-2">
            <div class="px-3 py-1.5 rounded-lg bg-[#253554] border border-cyan-500/25 text-sm font-semibold text-slate-100 mb-3 editable-field" data-field="headerBar">
              ${escapeHtml(node.headerBar || 'Escena 1: Encuentro')}
            </div>

            <div class="flex items-center gap-3 mb-2.5">
              ${avatarHtml}
              <div>
                <div class="text-xs font-bold text-white editable-field" data-field="speaker">${escapeHtml(node.speaker || charObj?.name || 'Sin personaje')}</div>
                <div class="text-[11px] text-slate-400 editable-field" data-field="speakerSub">${escapeHtml(node.speakerSub || 'Miniatura')}</div>
              </div>
            </div>

            <div class="text-xs text-slate-200 editable-field" data-field="dialogue">${escapeHtml(node.dialogue)}</div>

            <!-- Salidas reales repartidas en el borde (sin yOffset fijo) -->
            ${(node.portsOut || []).map((p, _idx, arr) => {
              const topPct = arr.length <= 1 ? '50%' : `${Math.round(30 + (_idx * 40) / Math.max(1, arr.length - 1))}%`;
              return `
              <div class="vn-port vn-port-ring-cyan vn-port-out"
                   style="right: -9px; top: ${topPct}; transform: translateY(-50%);"
                   data-node-id="${node.id}"
                   data-port-id="${p.id}"
                   data-port-dir="out"
                   data-port-color="${p.color || 'cyan'}"></div>
              `;
            }).join('')}
          </div>
        </div>
      `;
}
