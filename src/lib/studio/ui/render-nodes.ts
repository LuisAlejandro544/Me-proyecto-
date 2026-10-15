// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { findCustomAsset, getCharacterCatalog, resolveCharacter } from '../../assets';
import { escapeHtml } from '../domain/geometry';
import { attachNodeInteractions } from './interactions';
import { renderWires } from './render-wires';

export function renderNodes() {
  const layer = document.getElementById('nodesLayer');
  layer.innerHTML = '';

  ctx.state.nodes.forEach(node => {
    const el = document.createElement('div');
    el.className = `vn-node ${node.type === 'choice' ? 'vn-node-choice' : ''} ${ctx.selectedNodeId === node.id ? 'selected' : ''}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.style.width = `${node.width || 240}px`;
    el.dataset.nodeId = node.id;

    // Barra de acciones del nodo (táctil): editar ✏️ y eliminar 🗑.
    // Siempre visible en móvil; en escritorio aparece al seleccionar / hover.
    const toolbar = `
      <div class="vn-node-toolbar" role="toolbar" aria-label="Acciones del nodo">
        <button data-action="edit-node" data-node="${node.id}" title="Editar nodo (pregunta, personaje…)" aria-label="Editar nodo"
          class="vn-node-btn vn-node-btn-edit">✏️</button>
        <button data-action="delete-node" data-node="${node.id}" title="Eliminar nodo" aria-label="Eliminar nodo"
          class="vn-node-btn vn-node-btn-delete">🗑</button>
      </div>
    `;

    // 1. BANNER SCENE NODE (e.g., "Start Scene 1" in Image 1)
    if (node.type === 'banner_scene') {
      const charObj = resolveCharacter(node.characterId);
      el.innerHTML = `
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
            <img src="${charObj.banner}" alt="${escapeHtml(node.speaker)}" class="w-full h-full object-cover" />
            <button data-action="cycle-char" data-node="${node.id}" title="Cambiar sprite del personaje" class="vn-appear absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/65 text-[10px] text-cyan-300 opacity-0 group-hover:opacity-100 transition">
              Cambiar sprite
            </button>
          </div>

          <!-- Speaker Name -->
          <div class="text-xs font-bold mb-1" style="color: ${node.speakerColor || '#ff758c'}">
            <span class="editable-field" data-field="speaker">${escapeHtml(node.speaker)}</span>
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

    // 2. CHOICE / DECISION SPLIT NODE (Matches Image 1 & Image 2)
    // Diseño: UNA entrada real a la izquierda (in_main) + N salidas reales a la
    // derecha (out_<optId>) centradas en el borde de la tarjeta. Los puntos de la
    // izquierda de cada fila son solo decorativos (sin .vn-port ni data-port-id):
    // antes eran puertos reales dentro de la fila (left:-9px relativo a la fila =
    // ~12px dentro de la tarjeta) y se veían solapando el texto.
    else if (node.type === 'choice') {
      el.innerHTML = `
        <div class="p-3.5 relative">
          <!-- Entrada única real (toda la decisión se entra por aquí) -->
          <div class="vn-port vn-port-cyan vn-port-in"
               style="left: -9px; top: 28px;"
               data-node-id="${node.id}"
               data-port-id="in_main"
               data-port-dir="in"
               data-port-color="cyan"></div>
          <!-- Header (con hueco a la derecha: botón + y toolbar ✏️/🗑 del nodo) -->
          <div class="flex items-start justify-between gap-2 mb-2.5">
            <div class="min-w-0 flex-1 pr-12">
              <div class="text-xs sm:text-[13px] font-bold text-white">
                <span class="editable-field" data-field="title">${escapeHtml(node.title)}</span>
                ${!node.showAddButtons ? `<span class="font-normal text-slate-300 ml-1 editable-field" data-field="subtitle">${escapeHtml(node.subtitle || '')}</span>` : ''}
              </div>
              ${node.showAddButtons ? `<div class="text-[11px] text-slate-400">${escapeHtml(node.subtitle || 'Nodo de elección')}</div>` : ''}
            </div>
            <button data-action="add-choice-opt" data-node="${node.id}" title="Añadir rama de elección" class="w-6 h-6 shrink-0 rounded-full bg-slate-700/80 hover:bg-cyan-500/30 border border-slate-500/60 flex items-center justify-center text-xs font-bold text-slate-200 hover:text-cyan-200 transition">
              +
            </button>
          </div>

          <!-- Options List -->
          <div class="space-y-2.5">
            ${(node.options || []).map((opt, idx) => {
              let pillClass = 'bg-[#2a3352]/90 border-slate-500/40 text-slate-100';
              if (opt.style === 'coral') pillClass = 'bg-gradient-to-r from-[#5a343b] to-[#4a2c33] border-rose-400/50 text-rose-100';
              if (opt.style === 'teal') pillClass = 'bg-gradient-to-r from-[#1e485c] to-[#1a3b4e] border-cyan-400/50 text-cyan-100';
              const dotColor = (opt.inColor || opt.outColor || 'cyan') === 'coral' ? '#ff756b' : '#00f2fe';
              return `
                <div class="relative flex items-center vn-choice-row">
                  <!-- Choice Pill (punto de color decorativo, NO conectable) -->
                  <div class="w-full pl-3 pr-3 py-2 rounded-xl border ${pillClass} text-xs font-medium flex items-center gap-2 shadow-inner">
                    <span class="vn-choice-dot" style="background: ${dotColor}; box-shadow: 0 0 6px ${dotColor};"></span>
                    <span class="editable-option truncate flex-1 min-w-0" data-opt-idx="${idx}">${escapeHtml(opt.label)}</span>
                  </div>

                  <!-- Salida real: centrada en el borde de la TARJETA
                       (la fila está inset 14px por el p-3.5, así que -9px la
                       dejaría dentro; -23px la centra en el borde). -->
                  <div class="vn-port ${opt.outColor === 'coral' ? 'vn-port-ring-coral' : 'vn-port-ring-cyan'} vn-port-out vn-port-choice-out"
                       style="top: 50%; transform: translateY(-50%);"
                       data-node-id="${node.id}"
                       data-port-id="out_${opt.id}"
                       data-port-dir="out"
                       data-port-color="${opt.outColor || 'cyan'}"></div>
                </div>
              `;
            }).join('')}
          </div>

          ${node.showAddButtons ? `
            <button data-action="add-choice-opt" data-node="${node.id}" class="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#252d47] hover:bg-cyan-500/30 border border-slate-500/70 flex items-center justify-center text-xs text-slate-200 shadow-md">
              +
            </button>
          ` : ''}
        </div>
      `;
    }

    // 3. COMPACT SCENE NODE (e.g., "Forest Scene" in Image 1)
    else if (node.type === 'compact_scene') {
      el.innerHTML = `
        <div class="p-4 relative vn-node-pad-ports">
          <!-- Input Port -->
          <div class="vn-port ${node.inColor === 'coral' ? 'vn-port-coral' : 'vn-port-cyan'} vn-port-in"
               style="left: -9px; top: 24px;"
                data-node-id="${node.id}"
                data-port-id="in_main"
                data-port-dir="in"
                data-port-color="${node.inColor || 'cyan'}"></div>

          <div class="text-sm font-bold text-white mb-2 editable-field" data-field="title">${escapeHtml(node.title || 'Escena')}</div>
          <div class="text-xs text-slate-200 leading-relaxed whitespace-pre-line editable-field" data-field="dialogue">${escapeHtml(node.dialogue)}</div>

          <!-- Output Port -->
          <div class="vn-port vn-port-cyan vn-port-out"
               style="right: -9px; top: 50%; transform: translateY(-50%);"
                data-node-id="${node.id}"
                data-port-id="out_main"
                data-port-dir="out"
                data-port-color="cyan"></div>
        </div>
      `;
    }

    // 4. CHARACTER SELECTOR NODE (Exact match to bottom-right node in Image 1)
    else if (node.type === 'character_selector') {
      const charKeys = Object.keys(getCharacterCatalog());
      const selChar = resolveCharacter(node.selectedCharId);
      el.innerHTML = `
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

          <div class="text-sm font-bold text-white mb-2.5 text-center">${escapeHtml(node.title || 'Selector de personaje')}</div>

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
                       class="w-12 h-12 rounded-xl object-cover cursor-pointer transition ${isSel ? 'ring-2 ring-cyan-400 scale-105 shadow-[0_0_12px_rgba(0,242,254,0.5)]' : 'opacity-65 hover:opacity-100'}" />
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

    // 5. AVATAR SCENE NODE (Matches "Node 1: Introduction / Scene 1: Meetup" in Image 2)
    else if (node.type === 'avatar_scene') {
      const charObj = resolveCharacter(node.characterId);
      el.innerHTML = `
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
              <div class="text-xs font-bold text-white editable-field" data-field="topTitle">${escapeHtml(node.topTitle)}</div>
              <div class="text-[11px] text-slate-400">${escapeHtml(node.topSubtitle || 'Start')}</div>
            </div>
          ` : ''}
          <div class="p-3 pt-2">
            <div class="px-3 py-1.5 rounded-lg bg-[#253554] border border-cyan-500/25 text-xs font-semibold text-slate-100 mb-3 editable-field" data-field="headerBar">
              ${escapeHtml(node.headerBar || 'Escena 1: Encuentro')}
            </div>

            <div class="flex items-center gap-3 mb-2.5">
              <img src="${charObj.avatar}" data-action="cycle-char" data-node="${node.id}" title="Clic para cambiar de personaje" class="w-12 h-12 rounded-xl object-cover border border-white/20 cursor-pointer" />
              <div>
                <div class="text-xs font-bold text-white editable-field" data-field="speaker">${escapeHtml(node.speaker)}</div>
                <div class="text-[11px] text-slate-400">${escapeHtml(node.speakerSub || 'Miniatura')}</div>
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

    // 6. BRANCH SCENE NODE (Matches "Node 3: Scene 1A" and "Node 4: Scene 1B" in Image 2)
    else if (node.type === 'branch_scene') {
      const charObj = resolveCharacter(node.characterId);
      el.innerHTML = `
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

    // 7. VIDEO SCENE NODE — reproduce un vídeo de la carpeta en el playtest.
    else if (node.type === 'video_scene') {
      const video = findCustomAsset(node.videoAssetId);
      el.innerHTML = `
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
          <div class="text-xs font-bold text-fuchsia-300 truncate">${escapeHtml(node.videoName || video?.name || 'Sin vídeo asignado')}</div>
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

    // 8. SOUND CUE NODE (complemento) — disparo de audio al entrar en el paso.
    else if (node.type === 'sound_cue') {
      const sound = findCustomAsset(node.soundAssetId || node.audioAssetId);
      el.innerHTML = `
        <div class="p-3.5 relative vn-node-pad-ports">
          <div class="vn-port vn-port-cyan vn-port-in"
               style="left: -9px; top: 26px;"
               data-node-id="${node.id}"
               data-port-id="in_main"
               data-port-dir="in"
               data-port-color="cyan"></div>
          <div class="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold shadow-md mb-2.5">
            <span class="editable-field" data-field="badge">${escapeHtml(node.badge || '🔊 Sonido')}</span>
          </div>
          <div class="w-full rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-400/30 p-3 flex items-center gap-2.5 mb-2">
            <span class="text-2xl">🎵</span>
            <div class="min-w-0">
              <div class="text-xs font-bold text-amber-200 truncate">${escapeHtml(node.soundName || node.audioName || sound?.name || 'Sin audio')}</div>
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

    el.insertAdjacentHTML('afterbegin', toolbar);
    layer.appendChild(el);
  });

  attachNodeInteractions();
  requestAnimationFrame(() => renderWires());
}
