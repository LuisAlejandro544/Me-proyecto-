// @ts-nocheck
// Tarjeta video_scene (extraído de ui/render-nodes.ts — orquestador en ui/render-nodes.ts).
import { escapeHtml } from '../../domain/geometry';
import { findCustomAsset, getCharacterCatalog, resolveCharacter } from '../../../assets';
export function renderVideoCard(node): string {
  const charObj = resolveCharacter(node.characterId);
  const video = findCustomAsset(node.videoAssetId);
  const sound = findCustomAsset(node.soundAssetId || node.audioAssetId);
  const charKeys = Object.keys(getCharacterCatalog());
  const selChar = resolveCharacter(node.selectedCharId);
  return `
        <div class="p-3.5 relative vn-node-pad-ports">
          <div class="vn-port vn-port-cyan vn-port-in"
               style="left: -9px; top: 26px;"
               data-node-id="${node.id}"
               data-port-id="in_main"
               data-port-dir="in"
               data-port-color="cyan"></div>
          <div class="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white text-xs font-bold shadow-md mb-2.5">
            <span class="editable-field" data-field="badge">${escapeHtml(node.badge || 'Vídeo')}</span>
          </div>
          <div class="relative w-full rounded-xl overflow-hidden border border-fuchsia-400/30 mb-2.5 bg-black/60">
            ${video ? `<video src="${video.dataUrl}" class="w-full h-24 object-cover" muted playsinline preload="metadata"></video>` : `<div class="w-full h-24 flex flex-col items-center justify-center gap-1 text-3xl">🎬<span class="text-[10px] text-slate-300 font-semibold">Sin vídeo — toca ✏️ para elegir</span></div>`}
          </div>
          <div class="text-xs font-bold text-fuchsia-300 truncate editable-field" data-field="videoName">${escapeHtml(node.videoName || video?.name || 'Sin vídeo asignado')}</div>
          <div class="text-[11px] text-slate-400 truncate editable-field" data-field="dialogue">${escapeHtml(node.dialogue || 'Se reproduce y continúa…')}</div>
          <div class="text-[10px] text-slate-500 mt-1">${node.videoAutoplay === false ? '⏸ Manual' : '▶ Auto'} · ${node.videoLoop ? '🔁 Bucle' : '➡ Sigue'}${node.videoMuted ? ' · 🔇' : ''}</div>
          <div class="vn-port vn-port-cyan vn-port-out"
               style="right: -9px; top: 50%; transform: translateY(-50%);"
               data-node-id="${node.id}"
               data-port-id="out_main"
               data-port-dir="out"
               data-port-color="cyan"></div>
        </div>
      `;
}
