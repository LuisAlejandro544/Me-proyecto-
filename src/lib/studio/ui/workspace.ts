// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { CHARACTER_ASSETS } from '../data/assets';
import { playSynthSfx } from '../domain/audio';
import { escapeHtml } from '../domain/geometry';
import { pushHistory } from '../domain/history';
import { startPlaytest } from './playtest';
import { renderNodes } from './render-nodes';
import { showToast } from './toast';

export function openWorkspaceTab(tabName) {
  playSynthSfx('click');
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    const isCurrent = btn.dataset.tab === tabName;
    btn.classList.toggle('text-cyan-300', isCurrent);
    btn.classList.toggle('text-slate-400', !isCurrent);
  });

  if (tabName === 'playtest') {
    startPlaytest();
    return;
  }

  const modal = document.getElementById('drawerModal');
  const titleEl = document.getElementById('drawerModalTitle');
  const bodyEl = document.getElementById('drawerModalBody');

  if (tabName === 'nodes') {
    titleEl.textContent = 'Add New Node to Graph';
    bodyEl.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button data-new-node="banner_scene" class="p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-cyan-400/30 text-left transition">
          <div class="font-bold text-cyan-300 mb-1">🎬 Banner Scene Node</div>
          <div class="text-xs text-slate-400">16:9 anime scene illustration with speaker & dialogue ports.</div>
        </button>
        <button data-new-node="choice" class="p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-rose-400/30 text-left transition">
          <div class="font-bold text-rose-300 mb-1">🔀 Decision Split / Choice Node</div>
          <div class="text-xs text-slate-400">Branching player choices with coral and cyan output wires.</div>
        </button>
        <button data-new-node="branch_scene" class="p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-indigo-400/30 text-left transition">
          <div class="font-bold text-indigo-300 mb-1">💬 Avatar Dialogue Node</div>
          <div class="text-xs text-slate-400">Compact character thumbnail card for branching dialogue responses.</div>
        </button>
        <button data-new-node="character_selector" class="p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-emerald-400/30 text-left transition">
          <div class="font-bold text-emerald-300 mb-1">🎭 Character Selector Node</div>
          <div class="text-xs text-slate-400">Avatar carousel, expression dropdown, and live Scale/Position sliders.</div>
        </button>
      </div>
    `;
    modal.classList.remove('hidden');

    bodyEl.querySelectorAll('[data-new-node]').forEach(btn => {
      btn.onclick = () => {
        addNewNodeOfType(btn.dataset.newNode);
        modal.classList.add('hidden');
      };
    });
  } else if (tabName === 'assets') {
    titleEl.textContent = 'Project Assets & Character Sprites';
    bodyEl.innerHTML = `
      <p class="text-xs text-slate-400">Click any asset below to assign it to the currently selected node.</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        ${Object.values(CHARACTER_ASSETS).map(c => `
          <div data-assign-char="${c.id}" class="p-2.5 rounded-xl bg-[#1d2442] hover:bg-[#27315a] border border-slate-700 cursor-pointer text-center transition">
            <img src="${c.avatar}" class="w-20 h-20 mx-auto rounded-xl object-cover mb-2 border border-white/15" />
            <div class="text-xs font-bold text-white">${escapeHtml(c.name)}</div>
            <div class="text-[10px] text-cyan-300">${c.expressions.length} Expressions</div>
          </div>
        `).join('')}
      </div>
    `;
    modal.classList.remove('hidden');
    bodyEl.querySelectorAll('[data-assign-char]').forEach(card => {
      card.onclick = () => {
        const node = ctx.state.nodes.find(n => n.id === ctx.selectedNodeId);
        const cId = card.dataset.assignChar;
        if (node) {
          pushHistory();
          node.characterId = cId;
          node.selectedCharId = cId;
          node.speaker = CHARACTER_ASSETS[cId].name;
          renderNodes();
          showToast(`Assigned ${CHARACTER_ASSETS[cId].name} to selected node`);
        }
        modal.classList.add('hidden');
      };
    });
  } else if (tabName === 'timeline') {
    titleEl.textContent = 'Story Variables & Branching State';
    bodyEl.innerHTML = `
      <div class="space-y-3">
        <div class="text-xs text-slate-400">Track flags, affection points, and inventory items across story branches:</div>
        <div id="varsListContainer" class="space-y-2">
          ${Object.entries(ctx.state.variables || {}).map(([k, v]) => `
            <div class="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#101528] border border-slate-700">
              <span class="font-mono text-xs text-cyan-300">${escapeHtml(k)}</span>
              <input data-var-key="${escapeHtml(k)}" value="${escapeHtml(String(v))}" class="w-28 px-2 py-1 rounded bg-slate-800 text-xs text-right text-white border border-slate-600" />
            </div>
          `).join('')}
        </div>
        <div class="flex gap-2 pt-2">
          <input id="newVarName" placeholder="variable_name" class="flex-1 px-3 py-2 rounded-xl bg-[#101528] border border-slate-700 text-xs text-white" />
          <input id="newVarVal" placeholder="true / 10" class="w-28 px-3 py-2 rounded-xl bg-[#101528] border border-slate-700 text-xs text-white" />
          <button id="btnAddVar" class="px-4 py-2 rounded-xl bg-cyan-500 text-xs font-bold text-slate-950">+ Add</button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
    bodyEl.querySelectorAll('[data-var-key]').forEach(inp => {
      inp.onchange = () => {
        ctx.state.variables[inp.dataset.varKey] = inp.value;
        showToast(`Updated ${inp.dataset.varKey}`);
      };
    });
    document.getElementById('btnAddVar').onclick = () => {
      const k = document.getElementById('newVarName').value.trim();
      const v = document.getElementById('newVarVal').value.trim() || 'true';
      if (k) {
        ctx.state.variables[k] = v;
        openWorkspaceTab('timeline');
      }
    };
  } else if (tabName === 'characters') {
    titleEl.textContent = 'Cast & Character Profiles';
    bodyEl.innerHTML = `
      <div class="space-y-3">
        ${Object.values(CHARACTER_ASSETS).map(c => `
          <div class="flex items-center gap-3.5 p-3 rounded-xl bg-[#101528] border border-slate-700/80">
            <img src="${c.avatar}" class="w-14 h-14 rounded-xl object-cover border border-white/20" />
            <div class="flex-1">
              <div class="font-bold text-sm" style="color:${c.color}">${escapeHtml(c.name)}</div>
              <div class="text-xs text-slate-400">Available Poses: ${c.expressions.join(' • ')}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    modal.classList.remove('hidden');
  } else if (tabName === 'settings') {
    titleEl.textContent = 'Global Settings & Audio Synthesizer';
    bodyEl.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between p-3.5 rounded-xl bg-[#101528] border border-slate-700">
          <div>
            <div class="font-semibold text-white text-sm">Synthesized UI & Visual Novel SFX</div>
            <div class="text-xs text-slate-400">Web Audio API chimes when connecting nodes or making choices</div>
          </div>
          <button id="btnModalToggleSfx" class="px-4 py-1.5 rounded-lg text-xs font-bold ${ctx.sfxEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}">
            ${ctx.sfxEnabled ? 'Enabled' : 'Muted'}
          </button>
        </div>
        <div class="flex items-center justify-between p-3.5 rounded-xl bg-[#101528] border border-slate-700">
          <div>
            <div class="font-semibold text-white text-sm">Export Project JSON</div>
            <div class="text-xs text-slate-400">Save your raw node graph and variables as JSON</div>
          </div>
          <button id="btnDownloadJson" class="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white">
            Download .json
          </button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
    document.getElementById('btnModalToggleSfx').onclick = () => {
      ctx.sfxEnabled = !ctx.sfxEnabled;
      openWorkspaceTab('settings');
    };
    document.getElementById('btnDownloadJson').onclick = () => {
      const blob = new Blob([JSON.stringify(ctx.state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'my_novel_project.json';
      a.click();
      showToast('Downloaded my_novel_project.json');
    };
  }
}
export function addNewNodeOfType(type) {
  pushHistory();
  const id = 'node_' + Date.now().toString(36);
  const offsetX = Math.round((180 - ctx.state.panX) / ctx.state.zoom + (Math.random() * 80));
  const offsetY = Math.round((140 - ctx.state.panY) / ctx.state.zoom + (Math.random() * 60));

  if (type === 'banner_scene') {
    ctx.state.nodes.push({
      id,
      type: 'banner_scene',
      badge: `Scene ${ctx.state.nodes.length + 1}`,
      x: offsetX,
      y: offsetY,
      width: 245,
      characterId: 'sora',
      speaker: 'Sora',
      speakerColor: '#ff758c',
      dialogue: 'A new moment begins here.\nDouble-click to edit!',
      portsOut: [{ id: 'out_cyan', color: 'cyan', yOffset: 150 }]
    });
  } else if (type === 'choice') {
    ctx.state.nodes.push({
      id,
      type: 'choice',
      title: 'Node: Decision Split',
      subtitle: 'Choice Node',
      showAddButtons: true,
      x: offsetX,
      y: offsetY,
      width: 240,
      options: [
        { id: 'opt_1', label: 'Option A: "Take the path"', style: 'coral', inColor: 'cyan', outColor: 'coral' },
        { id: 'opt_2', label: 'Option B: "Stay behind"', style: 'teal', inColor: 'cyan', outColor: 'cyan' }
      ]
    });
  } else if (type === 'character_selector') {
    ctx.state.nodes.push({
      id,
      type: 'character_selector',
      title: 'Character Selector',
      x: offsetX,
      y: offsetY,
      width: 230,
      selectedCharId: 'yuki',
      expression: 'Yuki - Joyful',
      scale: 100,
      position: 50,
      inColor: 'coral'
    });
  } else {
    ctx.state.nodes.push({
      id,
      type: 'branch_scene',
      headerBar: `Node ${ctx.state.nodes.length + 1}: New Scene`,
      x: offsetX,
      y: offsetY,
      width: 250,
      characterId: 'aoi',
      speaker: 'Aoi',
      dialogue: 'Aoi: "Let\'s see where this leads!"',
      inColor: 'cyan'
    });
  }

  ctx.selectedNodeId = id;
  renderNodes();
  showToast('Added new node to canvas');
}
