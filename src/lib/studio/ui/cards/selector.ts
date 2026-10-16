// @ts-nocheck
// Tarjeta character_selector (extraído de ui/render-nodes.ts — orquestador en ui/render-nodes.ts).
import { escapeHtml } from '../../domain/geometry';
import { findCustomAsset, getCharacterCatalog, resolveCharacter } from '../../../assets';
export function renderSelectorCard(node): string {
  const charObj = resolveCharacter(node.characterId);
  const video = findCustomAsset(node.videoAssetId);
  const sound = findCustomAsset(node.soundAssetId || node.audioAssetId);
  const charKeys = Object.keys(getCharacterCatalog());
  const selChar = resolveCharacter(node.selectedCharId);
  return `
        <div class="p-3.5 relative vn-node-pad-ports">
          <!-- Input Port -->
          <div class="vn-port ${node.inColor === 'coral' ? 'vn-port-coral' : 'vn-port-cyan'} vn-port-in"
               style="left: -9px; top: 122px;"
                data-node-id="${node.id}"
                data-port-id="in_main"
                data-port-dir="in"
                data-port-color="${node.inColor || 'coral'}"></div>

          <!-- Output Port (para encadenar tras elegir personaje) -->
          <div class="vn-port vn-port-ring-cyan vn-port-out"
               style="right: -9px; top: 122px;"
               data-node-id="${node.id}"
               data-port-id="out_main"
               data-port-dir="out"
               data-port-color="cyan"></div>

          <div class="text-sm font-bold text-white mb-2.5 text-center editable-field" data-field="title">${escapeHtml(node.title || 'Selector de personaje')}</div>

          <!-- Avatar Carousel -->
          <div class="flex items-center justify-between gap-1.5 mb-3">
            <button data-action="char-prev" data-node="${node.id}" title="Anterior" class="p-1 text-slate-400 hover:text-white">‹</button>
            <div class="flex items-center gap-2 overflow-x-auto">
              ${(node.selectedCharId && !charKeys.slice(0, 3).includes(node.selectedCharId) ? [node.selectedCharId, ...charKeys.slice(0, 2)] : charKeys.slice(0, 3)).map(ck => {
                const c = getCharacterCatalog()[ck];
                if (!c) return '';
                const isSel = ck === node.selectedCharId;
                return `
                  <img src="${c.avatar}" data-action="select-char" data-node="${node.id}" data-char="${ck}"
                       alt="${c.name}"
                       class="w-12 h-12 rounded-xl object-cover cursor-pointer transition ${isSel ? 'ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.5)]' : 'opacity-65 hover:opacity-100'}" />
                `;
              }).join('')}
            </div>
            <button data-action="char-next" data-node="${node.id}" title="Siguiente" class="p-1 text-slate-400 hover:text-white">›</button>
          </div>

          <!-- Expression Dropdown -->
          <div class="mb-3">
            <select data-action="change-expr" data-node="${node.id}" class="w-full px-2.5 py-1.5 rounded-lg bg-[#252d4b] border border-slate-600/70 text-xs text-slate-100 outline-none">
              ${Object.values(getCharacterCatalog()).flatMap(c => c.expressions).map(exp => `
                <option value="${escapeHtml(exp)}" ${exp === node.expression ? 'selected' : ''}>${escapeHtml(exp)}</option>
              `).join('')}
            </select>
          </div>

          <!-- Scale Slider -->
          <div class="mb-2.5">
            <div class="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Tamaño</span>
              <span id="scaleVal_${node.id}">${node.scale || 92}%</span>
            </div>
            <input type="range" min="50" max="140" value="${node.scale || 92}"
                   data-action="slider-scale" data-node="${node.id}"
                   class="vn-slider" />
          </div>

          <!-- Position Slider -->
          <div>
            <div class="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Posición</span>
              <span id="posVal_${node.id}">${node.position || 62}%</span>
            </div>
            <input type="range" min="10" max="90" value="${node.position || 62}"
                   data-action="slider-pos" data-node="${node.id}"
                   class="vn-slider" />
          </div>
        </div>
      `;
}
