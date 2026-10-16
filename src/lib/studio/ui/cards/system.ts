// @ts-nocheck
// Tarjetas de nodos nuevos: jump, ending, background, narration, monologue, wait, effect.
import { escapeHtml } from '../../domain/geometry';
import { findCustomAsset } from '../../../assets';
import { EFFECT_KINDS, ENDING_KINDS } from '../../../types';

function inPort(node, color = 'cyan') {
  return `<div class="vn-port vn-port-${color} vn-port-in"
       style="left: -9px; top: 26px;"
       data-node-id="${node.id}" data-port-id="in_main"
       data-port-dir="in" data-port-color="${color}"></div>`;
}

function outPort(node, show = true, color = 'cyan') {
  if (!show) return '';
  return `<div class="vn-port vn-port-${color} vn-port-out"
       style="right: -9px; top: 50%; transform: translateY(-50%);"
       data-node-id="${node.id}" data-port-id="out_main"
       data-port-dir="out" data-port-color="${color}"></div>`;
}

export function renderJumpCard(node): string {
  return `
        <div class="p-3.5 relative vn-node-pad-ports">
          ${inPort(node)}
          <div class="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 text-sm font-bold shadow-md mb-2.5">
            <span class="editable-field" data-field="badge">${escapeHtml(node.badge || '↗️ Salto')}</span>
          </div>
          <div class="text-sm font-bold text-sky-200 truncate editable-field" data-field="title">${escapeHtml(node.title || 'Salto directo')}</div>
          <div class="text-[11px] text-slate-400 truncate">→ ${escapeHtml(node.jumpNodeId || node.jumpSceneId || 'sin destino')}</div>
          ${outPort(node)}
        </div>`;
}

export function renderEndingCard(node): string {
  const kind = ENDING_KINDS.find((k) => k.id === node.endingKind)?.label ?? '🏁 Final';
  return `
        <div class="p-3.5 relative vn-node-pad-ports">
          ${inPort(node, 'coral')}
          <div class="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-sm font-bold shadow-md mb-2.5">
            <span>${escapeHtml(kind)}</span>
          </div>
          <div class="text-sm font-bold text-emerald-200 editable-field" data-field="endingTitle">${escapeHtml(node.endingTitle || node.title || 'Final')}</div>
          <div class="text-[11px] text-slate-300 leading-snug whitespace-pre-line editable-field" data-field="dialogue">${escapeHtml(node.dialogue || 'Epílogo…')}</div>
        </div>`;
}

export function renderBackgroundCard(node): string {
  const bg = findCustomAsset(node.backgroundAssetId);
  const thumb = bg?.dataUrl
    ? `<img data-asset-thumb title="Doble clic para elegir la foto en Recursos" src="${bg.dataUrl}" alt="" class="w-full h-16 rounded-xl object-cover border border-white/15 cursor-pointer" />`
    : `<div data-asset-thumb title="Doble clic para elegir la foto en Recursos" class="w-full h-16 rounded-xl bg-slate-800 border border-dashed border-slate-600 flex items-center justify-center text-xl cursor-pointer">🖼️</div>`;
  return `
        <div class="p-3.5 relative vn-node-pad-ports">
          ${inPort(node)}
          <div class="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-sm font-bold shadow-md mb-2.5">
            <span class="editable-field" data-field="badge">${escapeHtml(node.badge || '🖼️ Fondo')}</span>
          </div>
          ${thumb}
          <div class="text-[11px] text-slate-400 truncate mt-1.5 editable-field" data-field="backgroundName" title="Doble clic para elegir la foto en Recursos">${escapeHtml(node.backgroundName || bg?.name || 'Sin fondo — doble clic para elegir')}</div>
          ${outPort(node)}
        </div>`;
}

export function renderNarrationCard(node): string {
  const bg = node.backgroundAssetId ? findCustomAsset(node.backgroundAssetId) : undefined;
  const thumb = bg?.dataUrl
    ? `<img data-asset-thumb title="Doble clic para elegir la foto en Recursos" src="${bg.dataUrl}" alt="" class="w-full h-12 rounded-xl object-cover border border-white/15 mt-2 cursor-pointer" />`
    : (node.backgroundAssetId
      ? `<div data-asset-thumb title="Doble clic para elegir la foto en Recursos" class="w-full rounded-xl bg-slate-800 border border-dashed border-slate-600 mt-2 px-2 py-1.5 text-[11px] text-slate-400 truncate cursor-pointer">🖼️ ${escapeHtml(node.backgroundName || bg?.name || 'Fondo…')}</div>`
      : '');
  return `
        <div class="p-3.5 relative vn-node-pad-ports">
          ${inPort(node)}
          <div class="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-slate-500 to-slate-700 text-white text-sm font-bold shadow-md mb-2.5">
            <span class="editable-field" data-field="badge">${escapeHtml(node.badge || '📖 Narración')}</span>
          </div>
          <div class="text-xs text-slate-100 leading-snug whitespace-pre-line editable-field" data-field="dialogue">${escapeHtml(node.dialogue || 'Narración…')}</div>
          ${thumb}
          ${outPort(node)}
        </div>`;
}

export function renderMonologueCard(node): string {
  return `
        <div class="p-3.5 relative vn-node-pad-ports">
          ${inPort(node)}
          <div class="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-bold shadow-md mb-2.5">
            <span class="editable-field" data-field="badge">${escapeHtml(node.badge || '💭 Monólogo')}</span>
          </div>
          <div class="text-[11px] font-bold text-violet-300 editable-field" data-field="speaker">${escapeHtml(node.speaker || '…')}</div>
          <div class="text-xs text-violet-100/90 italic leading-snug whitespace-pre-line editable-field" data-field="dialogue">${escapeHtml(node.dialogue || '(Piensa…)')}</div>
          ${outPort(node)}
        </div>`;
}

export function renderWaitCard(node): string {
  return `
        <div class="p-3.5 relative vn-node-pad-ports">
          ${inPort(node)}
          <div class="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 text-sm font-bold shadow-md mb-2.5">
            <span class="editable-field" data-field="badge">${escapeHtml(node.badge || '⏳ Pausa')}</span>
          </div>
          <div class="text-2xl font-black text-yellow-200 tabular-nums">${Number(node.waitMs ?? 800)}<span class="text-xs font-semibold"> ms</span></div>
          <div class="text-[11px] text-slate-400 truncate editable-field" data-field="dialogue">${escapeHtml(node.dialogue || 'Pausa…')}</div>
          ${outPort(node)}
        </div>`;
}

export function renderEffectCard(node): string {
  const label = EFFECT_KINDS.find((k) => k.id === node.effectKind)?.label ?? '✨ Efecto';
  return `
        <div class="p-3.5 relative vn-node-pad-ports">
          ${inPort(node)}
          <div class="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-sm font-bold shadow-md mb-2.5">
            <span class="editable-field" data-field="badge">${escapeHtml(node.badge || '✨ Efecto')}</span>
          </div>
          <div class="text-sm font-bold text-pink-200">${escapeHtml(label)} · ${Number(node.effectDurationMs ?? 600)} ms</div>
          <div class="text-[11px] text-slate-400 truncate editable-field" data-field="dialogue">${escapeHtml(node.dialogue || '')}</div>
          ${outPort(node)}
        </div>`;
}
