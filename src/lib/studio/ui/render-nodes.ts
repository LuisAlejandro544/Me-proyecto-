// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { CHARACTER_ASSETS } from '../data/assets';
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

    // 1. BANNER SCENE NODE (e.g., "Start Scene 1" in Image 1)
    if (node.type === 'banner_scene') {
      const charObj = CHARACTER_ASSETS[node.characterId] || CHARACTER_ASSETS.sora;
      el.innerHTML = `
        <div class="p-3.5 relative">
          <!-- Blue Start Badge -->
          <div class="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold shadow-md mb-2.5">
            <span class="editable-field" data-field="badge">${escapeHtml(node.badge || 'Start Scene 1')}</span>
          </div>

          <!-- 16:9 Character Banner -->
          <div class="relative w-full h-24 rounded-xl overflow-hidden border border-white/15 mb-2.5 shadow-inner group">
            <img src="${charObj.banner}" alt="${escapeHtml(node.speaker)}" class="w-full h-full object-cover" />
            <button data-action="cycle-char" data-node="${node.id}" title="Change Character Sprite" class="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/65 text-[10px] text-cyan-300 opacity-0 group-hover:opacity-100 transition">
              Swap Sprite
            </button>
          </div>

          <!-- Speaker Name -->
          <div class="text-xs font-bold mb-1" style="color: ${node.speakerColor || '#ff758c'}">
            <span class="editable-field" data-field="speaker">${escapeHtml(node.speaker)}</span>
          </div>

          <!-- Dialogue Text -->
          <div class="text-xs sm:text-[13px] text-slate-100 leading-snug whitespace-pre-line editable-field" data-field="dialogue">${escapeHtml(node.dialogue)}</div>

          <!-- Output Ports on Right -->
          ${(node.portsOut || []).map(p => `
            <div class="vn-port ${p.color === 'coral' ? 'vn-port-coral' : 'vn-port-cyan'}"
                 style="right: -7px; top: ${p.yOffset}px;"
                 data-node-id="${node.id}"
                 data-port-id="${p.id}"
                 data-port-dir="out"
                 data-port-color="${p.color}"></div>
          `).join('')}
        </div>
      `;
    }

    // 2. CHOICE / DECISION SPLIT NODE (Matches Image 1 & Image 2)
    else if (node.type === 'choice') {
      el.innerHTML = `
        <div class="p-3.5 relative">
          <!-- Header -->
          <div class="flex items-start justify-between mb-2.5">
            <div>
              <div class="text-xs sm:text-[13px] font-bold text-white">
                <span class="editable-field" data-field="title">${escapeHtml(node.title)}</span>
                ${!node.showAddButtons ? `<span class="font-normal text-slate-300 ml-1 editable-field" data-field="subtitle">${escapeHtml(node.subtitle || '')}</span>` : ''}
              </div>
              ${node.showAddButtons ? `<div class="text-[11px] text-slate-400">${escapeHtml(node.subtitle || 'Choice Node')}</div>` : ''}
            </div>
            <button data-action="add-choice-opt" data-node="${node.id}" title="Add Choice Branch" class="w-6 h-6 rounded-full bg-slate-700/80 hover:bg-cyan-500/30 border border-slate-500/60 flex items-center justify-center text-xs font-bold text-slate-200 hover:text-cyan-200 transition">
              +
            </button>
          </div>

          <!-- Options List -->
          <div class="space-y-2.5">
            ${(node.options || []).map((opt, idx) => {
              let pillClass = 'bg-[#2a3352]/90 border-slate-500/40 text-slate-100';
              if (opt.style === 'coral') pillClass = 'bg-gradient-to-r from-[#5a343b] to-[#4a2c33] border-rose-400/50 text-rose-100';
              if (opt.style === 'teal') pillClass = 'bg-gradient-to-r from-[#1e485c] to-[#1a3b4e] border-cyan-400/50 text-cyan-100';
              return `
                <div class="relative flex items-center">
                  <!-- Left Input Port -->
                  <div class="vn-port ${opt.inColor === 'coral' ? 'vn-port-coral' : 'vn-port-cyan'}"
                       style="left: -21px; top: 50%; transform: translateY(-50%);"
                       data-node-id="${node.id}"
                       data-port-id="in_${opt.id}"
                       data-port-dir="in"
                       data-port-color="${opt.inColor || 'cyan'}"></div>

                  <!-- Choice Pill -->
                  <div class="w-full px-3 py-2 rounded-xl border ${pillClass} text-xs font-medium flex items-center justify-between shadow-inner">
                    <span class="editable-option truncate" data-opt-idx="${idx}">${escapeHtml(opt.label)}</span>
                  </div>

                  <!-- Right Output Port -->
                  <div class="vn-port ${opt.outColor === 'coral' ? 'vn-port-ring-coral' : 'vn-port-ring-cyan'}"
                       style="right: -21px; top: 50%; transform: translateY(-50%);"
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
        <div class="p-4 relative">
          <!-- Input Port -->
          <div class="vn-port ${node.inColor === 'coral' ? 'vn-port-coral' : 'vn-port-cyan'}"
               style="left: -7px; top: 24px;"
               data-node-id="${node.id}"
               data-port-id="in_main"
               data-port-dir="in"
               data-port-color="${node.inColor || 'cyan'}"></div>

          <div class="text-sm font-bold text-white mb-2 editable-field" data-field="title">${escapeHtml(node.title || 'Scene')}</div>
          <div class="text-xs text-slate-200 leading-relaxed whitespace-pre-line editable-field" data-field="dialogue">${escapeHtml(node.dialogue)}</div>

          <!-- Output Port -->
          <div class="vn-port vn-port-cyan"
               style="right: -7px; top: 50%;"
               data-node-id="${node.id}"
               data-port-id="out_main"
               data-port-dir="out"
               data-port-color="cyan"></div>
        </div>
      `;
    }

    // 4. CHARACTER SELECTOR NODE (Exact match to bottom-right node in Image 1)
    else if (node.type === 'character_selector') {
      const charKeys = Object.keys(CHARACTER_ASSETS);
      const selChar = CHARACTER_ASSETS[node.selectedCharId] || CHARACTER_ASSETS.yuki;
      el.innerHTML = `
        <div class="p-3.5 relative">
          <!-- Input Port -->
          <div class="vn-port ${node.inColor === 'coral' ? 'vn-port-coral' : 'vn-port-cyan'}"
               style="left: -7px; top: 122px;"
               data-node-id="${node.id}"
               data-port-id="in_main"
               data-port-dir="in"
               data-port-color="${node.inColor || 'coral'}"></div>

          <div class="text-sm font-bold text-white mb-2.5 text-center">${escapeHtml(node.title || 'Character Selector')}</div>

          <!-- Avatar Carousel -->
          <div class="flex items-center justify-between gap-1.5 mb-3">
            <button data-action="char-prev" data-node="${node.id}" class="p-1 text-slate-400 hover:text-white">‹</button>
            <div class="flex items-center gap-2 overflow-hidden">
              ${charKeys.slice(0, 3).map(ck => {
                const c = CHARACTER_ASSETS[ck];
                const isSel = ck === node.selectedCharId;
                return `
                  <img src="${c.avatar}" data-action="select-char" data-node="${node.id}" data-char="${ck}"
                       alt="${c.name}"
                       class="w-12 h-12 rounded-xl object-cover cursor-pointer transition ${isSel ? 'ring-2 ring-cyan-400 scale-105 shadow-[0_0_12px_rgba(0,242,254,0.5)]' : 'opacity-65 hover:opacity-100'}" />
                `;
              }).join('')}
            </div>
            <button data-action="char-next" data-node="${node.id}" class="p-1 text-slate-400 hover:text-white">›</button>
          </div>

          <!-- Expression Dropdown -->
          <div class="mb-3">
            <select data-action="change-expr" data-node="${node.id}" class="w-full px-2.5 py-1.5 rounded-lg bg-[#252d4b] border border-slate-600/70 text-xs text-slate-100 outline-none">
              ${Object.values(CHARACTER_ASSETS).flatMap(c => c.expressions).map(exp => `
                <option value="${escapeHtml(exp)}" ${exp === node.expression ? 'selected' : ''}>${escapeHtml(exp)}</option>
              `).join('')}
            </select>
          </div>

          <!-- Scale Slider -->
          <div class="mb-2.5">
            <div class="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Scale</span>
              <span id="scaleVal_${node.id}">${node.scale || 92}%</span>
            </div>
            <input type="range" min="50" max="140" value="${node.scale || 92}"
                   data-action="slider-scale" data-node="${node.id}"
                   class="vn-slider" />
          </div>

          <!-- Position Slider -->
          <div>
            <div class="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Position</span>
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
      const charObj = CHARACTER_ASSETS[node.characterId] || CHARACTER_ASSETS.aoi;
      el.innerHTML = `
        <div class="relative">
          ${node.topTitle ? `
            <div class=" -top-11 left-0.5 mb-1.5 px-3 pt-2.5">
              <div class="text-xs font-bold text-white editable-field" data-field="topTitle">${escapeHtml(node.topTitle)}</div>
              <div class="text-[11px] text-slate-400">${escapeHtml(node.topSubtitle || 'Start')}</div>
            </div>
          ` : ''}
          <div class="p-3 pt-2">
            <div class="px-3 py-1.5 rounded-lg bg-[#253554] border border-cyan-500/25 text-xs font-semibold text-slate-100 mb-3 editable-field" data-field="headerBar">
              ${escapeHtml(node.headerBar || 'Scene 1: Meetup')}
            </div>

            <div class="flex items-center gap-3 mb-2.5">
              <img src="${charObj.avatar}" data-action="cycle-char" data-node="${node.id}" title="Click to swap character" class="w-12 h-12 rounded-xl object-cover border border-white/20 cursor-pointer" />
              <div>
                <div class="text-xs font-bold text-white editable-field" data-field="speaker">${escapeHtml(node.speaker)}</div>
                <div class="text-[11px] text-slate-400">${escapeHtml(node.speakerSub || 'Thumbnail')}</div>
              </div>
            </div>

            <div class="text-xs text-slate-200 editable-field" data-field="dialogue">${escapeHtml(node.dialogue)}</div>

            <!-- Output Ports -->
            ${(node.portsOut || []).map(p => `
              <div class="vn-port vn-port-ring-cyan"
                   style="right: -7px; top: ${p.yOffset}px;"
                   data-node-id="${node.id}"
                   data-port-id="${p.id}"
                   data-port-dir="out"
                   data-port-color="${p.color || 'cyan'}"></div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 6. BRANCH SCENE NODE (Matches "Node 3: Scene 1A" and "Node 4: Scene 1B" in Image 2)
    else if (node.type === 'branch_scene') {
      const charObj = CHARACTER_ASSETS[node.characterId] || CHARACTER_ASSETS.mio;
      el.innerHTML = `
        <div class="relative overflow-visible">
          <!-- Input Port -->
          <div class="vn-port ${node.inColor === 'coral' ? 'vn-port-ring-coral' : 'vn-port-ring-cyan'}"
               style="left: -7px; top: 62px;"
               data-node-id="${node.id}"
               data-port-id="in_main"
               data-port-dir="in"
               data-port-color="${node.inColor || 'cyan'}"></div>

          <div class="px-3.5 py-2 border-b border-slate-700/70 text-xs font-bold text-white editable-field" data-field="headerBar">
            ${escapeHtml(node.headerBar || 'Scene Branch')}
          </div>

          <div class="p-3.5 flex items-center gap-3">
            <img src="${charObj.avatar}" data-action="cycle-char" data-node="${node.id}" class="w-12 h-12 rounded-xl object-cover border border-white/20 cursor-pointer shrink-0" />
            <div class="text-xs text-slate-100 leading-snug editable-field" data-field="dialogue">${escapeHtml(node.dialogue)}</div>
          </div>

          <!-- Output Port -->
          <div class="vn-port vn-port-ring-cyan"
               style="right: -7px; top: 62px;"
               data-node-id="${node.id}"
               data-port-id="out_main"
               data-port-dir="out"
               data-port-color="cyan"></div>
        </div>
      `;
    }

    layer.appendChild(el);
  });

  attachNodeInteractions();
  requestAnimationFrame(() => renderWires());
}
