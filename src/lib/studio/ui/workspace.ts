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
import {
  getCustomAssets,
  pickAssetsFromDevice,
  removeCustomAsset,
  takePhotoAsAsset
} from '../../assets';
import { isCapacitor } from '../../platform';

/** Catálogo combinado: personajes incluidos + recursos importados por el usuario. */
export function allCharacterAssets() {
  const customs = {};
  for (const a of getCustomAssets()) {
    if (a.kind !== 'imagen') continue;
    customs[a.id] = {
      id: a.id,
      name: a.name,
      color: '#22d3ee',
      avatar: a.dataUrl,
      banner: a.dataUrl,
      expressions: ['Personalizado'],
      custom: true
    };
  }
  return { ...CHARACTER_ASSETS, ...customs };
}

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
    titleEl.textContent = 'Añadir nodo nuevo al grafo';
    bodyEl.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button data-new-node="banner_scene" class="p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-cyan-400/30 text-left transition">
          <div class="font-bold text-cyan-300 mb-1">🎬 Nodo de escena con pancarta</div>
          <div class="text-xs text-slate-400">Ilustración de escena 16:9 con puertos de hablante y diálogo.</div>
        </button>
        <button data-new-node="choice" class="p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-rose-400/30 text-left transition">
          <div class="font-bold text-rose-300 mb-1">🔀 Nodo de decisión / elección</div>
          <div class="text-xs text-slate-400">Decisiones del jugador con ramificaciones color coral y cian.</div>
        </button>
        <button data-new-node="branch_scene" class="p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-indigo-400/30 text-left transition">
          <div class="font-bold text-indigo-300 mb-1">💬 Nodo de diálogo con avatar</div>
          <div class="text-xs text-slate-400">Tarjeta compacta con miniatura para respuestas con ramificaciones.</div>
        </button>
        <button data-new-node="character_selector" class="p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-emerald-400/30 text-left transition">
          <div class="font-bold text-emerald-300 mb-1">🎭 Nodo selector de personaje</div>
          <div class="text-xs text-slate-400">Carrusel de avatares, lista de expresiones y deslizadores de tamaño y posición.</div>
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
    titleEl.textContent = 'Recursos del proyecto y sprites de personajes';
    const catalog = allCharacterAssets();
    const customs = getCustomAssets();
    bodyEl.innerHTML = `
      <div class="p-3.5 rounded-xl bg-[#101528] border border-cyan-500/30 space-y-2.5">
        <div class="font-semibold text-white text-sm">📥 Importar tus imágenes y audios</div>
        <p class="text-xs text-slate-400">En web, PC y móvil se abre tu galería o tu administrador de archivos. En móvil también puedes usar la cámara.</p>
        <div class="flex flex-wrap gap-2">
          <button id="btnImportAssets" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 transition">
            🖼️ Importar desde galería / archivos
          </button>
          ${isCapacitor() ? `<button id="btnTakePhoto" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition">📷 Tomar foto</button>` : ''}
        </div>
        ${customs.length ? `<div class="text-[11px] text-slate-400">Tienes ${customs.length} recurso(s) importado(s). Pulsa uno para asignarlo al nodo seleccionado.</div>` : `<div class="text-[11px] text-slate-400">Aún no hay recursos importados. Los que importes aparecen aquí y en «Personajes».</div>`}
      </div>
      <p class="text-xs text-slate-400 pt-1">Pulsa cualquier recurso para asignarlo al nodo seleccionado.</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        ${Object.values(catalog).map(c => `
          <div data-assign-char="${c.id}" class="relative p-2.5 rounded-xl bg-[#1d2442] hover:bg-[#27315a] border border-slate-700 cursor-pointer text-center transition">
            ${c.custom ? `<button data-remove-custom="${c.id}" title="Eliminar recurso" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-500/90 text-white text-xs font-bold leading-none">×</button>` : ''}
            <img src="${c.avatar}" class="w-20 h-20 mx-auto rounded-xl object-cover mb-2 border border-white/15" />
            <div class="text-xs font-bold text-white">${escapeHtml(c.name)}</div>
            <div class="text-[10px] text-cyan-300">${c.expressions.length} ${c.expressions.length === 1 ? 'expresión' : 'expresiones'}${c.custom ? ' • tuyo' : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
    modal.classList.remove('hidden');

    document.getElementById('btnImportAssets').onclick = async () => {
      showToast('Abriendo tu galería / archivos…');
      const res = await pickAssetsFromDevice();
      if (res.agregados > 0) {
        showToast(`Importado(s) ${res.agregados} recurso(s) 🎉`);
        openWorkspaceTab('assets');
      } else if (res.rechazados.length) {
        showToast(res.rechazados[0]);
      } else {
        showToast('No se eligió ningún archivo');
      }
    };
    const photoBtn = document.getElementById('btnTakePhoto');
    if (photoBtn) {
      photoBtn.onclick = async () => {
        const res = await takePhotoAsAsset();
        if (res.agregados > 0) {
          showToast('Foto guardada como recurso 📷');
          openWorkspaceTab('assets');
        } else {
          showToast('No se tomó ninguna foto');
        }
      };
    }
    bodyEl.querySelectorAll('[data-remove-custom]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        removeCustomAsset(btn.dataset.removeCustom);
        showToast('Recurso eliminado');
        openWorkspaceTab('assets');
      };
    });
    bodyEl.querySelectorAll('[data-assign-char]').forEach(card => {
      card.onclick = () => {
        const node = ctx.state.nodes.find(n => n.id === ctx.selectedNodeId);
        const cId = card.dataset.assignChar;
        const catalogNow = allCharacterAssets();
        if (node && catalogNow[cId]) {
          pushHistory();
          node.characterId = cId;
          node.selectedCharId = cId;
          node.speaker = catalogNow[cId].name;
          renderNodes();
          showToast(`«${catalogNow[cId].name}» asignado al nodo seleccionado`);
        }
        modal.classList.add('hidden');
      };
    });
  } else if (tabName === 'timeline') {
    titleEl.textContent = 'Variables de historia y estado de ramificaciones';
    bodyEl.innerHTML = `
      <div class="space-y-3">
        <div class="text-xs text-slate-400">Controla banderas, puntos de afecto y objetos del inventario entre ramas:</div>
        <div id="varsListContainer" class="space-y-2">
          ${Object.entries(ctx.state.variables || {}).map(([k, v]) => `
            <div class="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#101528] border border-slate-700">
              <span class="font-mono text-xs text-cyan-300">${escapeHtml(k)}</span>
              <input data-var-key="${escapeHtml(k)}" value="${escapeHtml(String(v))}" class="w-28 px-2 py-1 rounded bg-slate-800 text-xs text-right text-white border border-slate-600" />
            </div>
          `).join('')}
        </div>
        <div class="flex gap-2 pt-2">
          <input id="newVarName" placeholder="nombre_variable" class="flex-1 px-3 py-2 rounded-xl bg-[#101528] border border-slate-700 text-xs text-white" />
          <input id="newVarVal" placeholder="true / 10" class="w-28 px-3 py-2 rounded-xl bg-[#101528] border border-slate-700 text-xs text-white" />
          <button id="btnAddVar" class="px-4 py-2 rounded-xl bg-cyan-500 text-xs font-bold text-slate-950">+ Añadir</button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
    bodyEl.querySelectorAll('[data-var-key]').forEach(inp => {
      inp.onchange = () => {
        ctx.state.variables[inp.dataset.varKey] = inp.value;
        showToast(`«${inp.dataset.varKey}» actualizada`);
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
    titleEl.textContent = 'Reparto y perfiles de personajes';
    const catalog = allCharacterAssets();
    const customs = getCustomAssets().filter(a => a.kind === 'imagen');
    bodyEl.innerHTML = `
      <div class="p-3.5 rounded-xl bg-[#101528] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2">
        <div class="text-xs text-slate-300">¿Quieres usar tus propias fotos como sprites?</div>
        <div class="flex gap-2">
          <button id="btnImportCharAssets" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 transition">🖼️ Importar</button>
          ${isCapacitor() ? `<button id="btnTakeCharPhoto" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition">📷 Cámara</button>` : ''}
        </div>
      </div>
      <div class="space-y-3 pt-1">
        ${Object.values(catalog).map(c => `
          <div class="flex items-center gap-3.5 p-3 rounded-xl bg-[#101528] border border-slate-700/80">
            <img src="${c.avatar}" class="w-14 h-14 rounded-xl object-cover border border-white/20" />
            <div class="flex-1">
              <div class="font-bold text-sm" style="color:${c.color}">${escapeHtml(c.name)}${c.custom ? ' (tuyo)' : ''}</div>
              <div class="text-xs text-slate-400">Poses disponibles: ${c.expressions.join(' • ')}</div>
            </div>
            ${c.custom ? `<button data-remove-custom="${c.id}" class="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs font-semibold text-rose-300">Eliminar</button>` : ''}
          </div>
        `).join('')}
        ${customs.length ? '' : `<p class="text-[11px] text-slate-500">Consejo: en el móvil la galería se abre directamente; en PC se abre el administrador de archivos.</p>`}
      </div>
    `;
    modal.classList.remove('hidden');
    document.getElementById('btnImportCharAssets').onclick = async () => {
      showToast('Abriendo tu galería / archivos…');
      const res = await pickAssetsFromDevice({ accept: 'image/*', multiple: true });
      if (res.agregados > 0) {
        showToast(`Importado(s) ${res.agregados} personaje(s) 🎉`);
        openWorkspaceTab('characters');
      } else if (res.rechazados.length) {
        showToast(res.rechazados[0]);
      } else {
        showToast('No se eligió ningún archivo');
      }
    };
    const takeBtn = document.getElementById('btnTakeCharPhoto');
    if (takeBtn) {
      takeBtn.onclick = async () => {
        const res = await takePhotoAsAsset();
        if (res.agregados > 0) {
          showToast('Foto guardada como personaje 📷');
          openWorkspaceTab('characters');
        }
      };
    }
    bodyEl.querySelectorAll('[data-remove-custom]').forEach(btn => {
      btn.onclick = () => {
        removeCustomAsset(btn.dataset.removeCustom);
        showToast('Recurso eliminado');
        openWorkspaceTab('characters');
      };
    });
  } else if (tabName === 'settings') {
    titleEl.textContent = 'Ajustes globales y sintetizador de audio';
    bodyEl.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between p-3.5 rounded-xl bg-[#101528] border border-slate-700">
          <div>
            <div class="font-semibold text-white text-sm">Efectos de sonido de la interfaz y la novela</div>
            <div class="text-xs text-slate-400">Timbres Web Audio al conectar nodos o elegir opciones</div>
          </div>
          <button id="btnModalToggleSfx" class="px-4 py-1.5 rounded-lg text-xs font-bold ${ctx.sfxEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}">
            ${ctx.sfxEnabled ? 'Activado' : 'Silenciado'}
          </button>
        </div>
        <div class="flex items-center justify-between p-3.5 rounded-xl bg-[#101528] border border-slate-700">
          <div>
            <div class="font-semibold text-white text-sm">Exportar proyecto como JSON</div>
            <div class="text-xs text-slate-400">Guarda tu grafo de nodos y variables como JSON</div>
          </div>
          <button id="btnDownloadJson" class="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white">
            Descargar .json
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
      a.download = 'mi_novela_proyecto.json';
      a.click();
      showToast('«mi_novela_proyecto.json» descargado');
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
      badge: `Escena ${ctx.state.nodes.length + 1}`,
      x: offsetX,
      y: offsetY,
      width: 245,
      characterId: 'sora',
      speaker: 'Sora',
      speakerColor: '#ff758c',
      dialogue: 'Un nuevo momento empieza aquí.\n¡Doble clic para editar!',
      portsOut: [{ id: 'out_cyan', color: 'cyan', yOffset: 150 }]
    });
  } else if (type === 'choice') {
    ctx.state.nodes.push({
      id,
      type: 'choice',
      title: 'Nodo: bifurcación de decisión',
      subtitle: 'Nodo de elección',
      showAddButtons: true,
      x: offsetX,
      y: offsetY,
      width: 240,
      options: [
        { id: 'opt_1', label: 'Opción A: «Tomar el camino»', style: 'coral', inColor: 'cyan', outColor: 'coral' },
        { id: 'opt_2', label: 'Opción B: «Quedarse atrás»', style: 'teal', inColor: 'cyan', outColor: 'cyan' }
      ]
    });
  } else if (type === 'character_selector') {
    ctx.state.nodes.push({
      id,
      type: 'character_selector',
      title: 'Selector de personaje',
      x: offsetX,
      y: offsetY,
      width: 230,
      selectedCharId: 'yuki',
      expression: 'Yuki - Alegre',
      scale: 100,
      position: 50,
      inColor: 'coral'
    });
  } else {
    ctx.state.nodes.push({
      id,
      type: 'branch_scene',
      headerBar: `Nodo ${ctx.state.nodes.length + 1}: Escena nueva`,
      x: offsetX,
      y: offsetY,
      width: 250,
      characterId: 'aoi',
      speaker: 'Aoi',
      dialogue: 'Aoi: «¡Veamos a dónde lleva esto!»',
      inColor: 'cyan'
    });
  }

  ctx.selectedNodeId = id;
  renderNodes();
  showToast('Nodo nuevo añadido al lienzo');
}
