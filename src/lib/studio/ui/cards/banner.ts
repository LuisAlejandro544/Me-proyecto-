// @ts-nocheck
// Tarjeta banner_scene (extraído de ui/render-nodes.ts — orquestador en ui/render-nodes.ts).
import { escapeHtml } from '../../domain/geometry';
import { findCustomAsset, getCharacterCatalog, resolveCharacter } from '../../../assets';
export function renderBannerCard(node): string {
  const charObj = resolveCharacter(node.characterId);
  const video = findCustomAsset(node.videoAssetId);
  const sound = findCustomAsset(node.soundAssetId || node.audioAssetId);
  const charKeys = Object.keys(getCharacterCatalog());
  const selChar = resolveCharacter(node.selectedCharId);
  const bannerHtml = charObj?.banner
    ? `<img src="${charObj.banner}" alt="${escapeHtml(node.speaker || charObj.name || '')}" class="w-full h-full object-cover" />`
    : `<div class="w-full h-full flex flex-col items-center justify-center gap-1 bg-slate-800/80 text-slate-400 text-2xl">🎭<span class="text-[10px] font-semibold">Sin personaje — toca ✏️ para elegir</span></div>`;
  return `
        <div class="p-3.5 relative vn-node-pad-ports">
          <!-- Input Port (permite ciclos / volver a la escena inicial) -->
          <div class="vn-port vn-port-cyan vn-port-in vn-port-dim"
               style="left: -9px; top: 26px;"
               data-node-id="${node.id}"
               data-port-id="in_main"
               data-port-dir="in"
               data-port-color="cyan"></div>
          <!-- Blue Start Badge -->
          <div class="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold shadow-md mb-2.5">
            <span class="editable-field" data-field="badge">${escapeHtml(node.badge || 'Escena inicial 1')}</span>
          </div>

          <!-- 16:9 Character Banner -->
          <div class="relative w-full h-24 rounded-xl overflow-hidden border border-white/15 mb-2.5 shadow-inner group">
            ${bannerHtml}
            <button data-action="cycle-char" data-node="${node.id}" title="Cambiar sprite del personaje" class="vn-appear absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/65 text-[10px] text-cyan-300 opacity-0 group-hover:opacity-100 transition">
              Cambiar sprite
            </button>
          </div>

          <!-- Speaker Name -->
          <div class="text-xs font-bold mb-1" style="color: ${node.speakerColor || charObj?.color || '#94a3b8'}">
            <span class="editable-field" data-field="speaker">${escapeHtml(node.speaker || charObj?.name || 'Sin personaje')}</span>
          </div>

          <!-- Dialogue Text -->
          <div class="text-xs sm:text-[13px] text-slate-100 leading-snug whitespace-pre-line editable-field" data-field="dialogue">${escapeHtml(node.dialogue)}</div>

          <!-- Salidas reales a la derecha, repartidas en el borde de la tarjeta
               (el yOffset fijo quedaba en la esquina inferior al crecer el texto) -->
          ${(node.portsOut || []).map((p, _idx, arr) => {
            const topPct = arr.length <= 1 ? '50%' : `${Math.round(30 + (_idx * 40) / Math.max(1, arr.length - 1))}%`;
            return `
            <div class="vn-port ${p.color === 'coral' ? 'vn-port-coral' : 'vn-port-cyan'} vn-port-out"
                 style="right: -9px; top: ${topPct}; transform: translateY(-50%);"
                 data-node-id="${node.id}"
                 data-port-id="${p.id}"
                 data-port-dir="out"
                 data-port-color="${p.color}"></div>
            `;
          }).join('')}
        </div>
      `;
}
