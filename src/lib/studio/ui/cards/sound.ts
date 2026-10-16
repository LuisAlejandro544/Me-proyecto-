// @ts-nocheck
// Tarjeta sound_cue (extraído de ui/render-nodes.ts — orquestador en ui/render-nodes.ts).
import { escapeHtml } from '../../domain/geometry';
import { findCustomAsset, getCharacterCatalog, resolveCharacter } from '../../../assets';
export function renderSoundCard(node): string {
  const charObj = resolveCharacter(node.characterId);
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
          <div class="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-sm font-bold shadow-md mb-2.5">
            <span class="editable-field" data-field="badge">${escapeHtml(node.badge || '🔊 Sonido')}</span>
          </div>
          <div class="w-full rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-400/30 p-3 flex items-center gap-2.5 mb-2">
            <span class="text-2xl">🎵</span>
            <div class="min-w-0">
              <div class="text-sm font-bold text-amber-200 truncate editable-field" data-field="soundName">${escapeHtml(node.soundName || node.audioName || sound?.name || 'Sin audio')}</div>
              <div class="text-[10px] text-slate-400">Vol ${(node.volume ?? 100)}% · ${node.loop ? '🔁 Bucle' : '1×'}</div>
            </div>
          </div>
          <div class="text-[11px] text-slate-400 truncate editable-field" data-field="dialogue">${escapeHtml(node.dialogue || 'Complemento: no bloquea la historia')}</div>
          <div class="vn-port vn-port-coral vn-port-out"
               style="right: -9px; top: 50%; transform: translateY(-50%);"
               data-node-id="${node.id}"
               data-port-id="out_main"
               data-port-dir="out"
               data-port-color="coral"></div>
        </div>
      `;
}
