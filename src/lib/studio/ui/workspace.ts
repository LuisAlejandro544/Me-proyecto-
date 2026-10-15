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
import { getCurrentVersion, getUpdateRepo, setUpdateRepo, checkForUpdates } from './updater';
import {
  assetSizeLabel,
  getAllAssetTags,
  getCustomAssets,
  normalizeTags,
  pickAudioFiles,
  pickFilesAsAssets,
  pickGalleryImages,
  pickGalleryVideos,
  removeCustomAsset,
  renameCustomAsset,
  setAssetTags,
  takePhotoAsAsset
} from '../../assets';

/** Memoria de la carpeta para no perder búsqueda/filtro al re-renderizar. */
let lastAssetsQuery = '';
let lastAssetsFilter: 'todos' | 'imagen' | 'video' | 'audio' = 'todos';
let lastAssetsTag = '';
let lastTab = 'nodes';

/** Transición de entrada cada vez que se cambia de apartado. */
function animateTabSwitch(tabName: string) {
  const bodyEl = document.getElementById('drawerModalBody');
  if (!bodyEl) {
    lastTab = tabName;
    return;
  }
  bodyEl.classList.remove('vn-tab-enter');
  void (bodyEl as HTMLElement).offsetWidth;
  bodyEl.classList.add('vn-tab-enter');
  bodyEl.querySelectorAll('.vn-anim-card').forEach((el, i) => {
    (el as HTMLElement).style.animationDelay = `${Math.min(i * 45, 450)}ms`;
  });
  document.querySelectorAll('.nav-tab-btn').forEach((b) => {
    b.classList.remove('nav-tab-pop');
    if ((b as HTMLElement).dataset.tab === tabName) {
      void (b as HTMLElement).offsetWidth;
      b.classList.add('nav-tab-pop');
    }
  });
  lastTab = tabName;
}

function handleImportResult(res: { agregados: number; rechazados: string[] }, okMsg: string, reopen: () => void) {
  if (res.agregados > 0) {
    showToast(`${okMsg}: ${res.agregados} recurso(s) 🎉`);
    reopen();
  } else if (res.rechazados.length) {
    showToast(res.rechazados[0]);
  } else {
    showToast('No se eligió ningún archivo');
  }
}

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

function assetPreviewHtml(a: { kind: string; dataUrl: string; name: string }): string {
  if (a.kind === 'imagen') {
    return `<img src="${a.dataUrl}" loading="lazy" class="w-full h-24 rounded-lg object-cover border border-white/15" alt="${escapeHtml(a.name)}" />`;
  }
  if (a.kind === 'video') {
    return `<video src="${a.dataUrl}" muted playsinline preload="metadata" class="w-full h-24 rounded-lg object-cover border border-fuchsia-400/30 bg-black"></video>`;
  }
  return `<div class="w-full h-24 rounded-lg bg-gradient-to-br from-violet-600/40 to-cyan-500/30 border border-white/15 flex flex-col items-center justify-center gap-1 text-2xl">🎵<span class="text-[10px] text-slate-300 font-semibold">Audio</span></div>`;
}

function wireFolderActions(reopen: () => void, scope: 'assets' | 'characters') {
  const bodyEl = document.getElementById('drawerModalBody');
  if (!bodyEl) return;

  const btnFiles = bodyEl.querySelector('#btnAddMoreFiles');
  if (btnFiles) {
    (btnFiles as HTMLElement).onclick = async () => {
      showToast(scope === 'assets' ? 'Abriendo archivos…' : 'Abriendo archivos de imagen…');
      const res = await pickFilesAsAssets(scope === 'assets' ? undefined : 'image/*,.png,.jpg,.jpeg,.webp,.gif');
      handleImportResult(res, 'Añadido a la carpeta', reopen);
    };
  }
  const btnGallery = bodyEl.querySelector('#btnAddMoreGallery');
  if (btnGallery) {
    (btnGallery as HTMLElement).onclick = async () => {
      showToast('Abriendo galería…');
      const res = await pickGalleryImages(10);
      if (res.agregados > 0) {
        handleImportResult(res, 'Añadido a la carpeta', reopen);
      } else {
        // En móvil el usuario puede preferir Archivos tras cancelar galería.
        showToast('Galería sin selección — prueba con «Archivos»');
      }
    };
  }
  const btnCamera = bodyEl.querySelector('#btnAddMoreCamera');
  if (btnCamera) {
    (btnCamera as HTMLElement).onclick = async () => {
      const res = await takePhotoAsAsset();
      if (res.agregados > 0) {
        showToast('Foto guardada en la carpeta 📷');
        reopen();
      } else {
        showToast('No se tomó ninguna foto');
      }
    };
  }
  const btnVideo = bodyEl.querySelector('#btnAddMoreVideo');
  if (btnVideo) {
    (btnVideo as HTMLElement).onclick = async () => {
      showToast('Abriendo vídeos…');
      const res = await pickGalleryVideos();
      handleImportResult(res, 'Vídeo(s) añadido(s)', reopen);
    };
  }
  const btnAudio = bodyEl.querySelector('#btnAddMoreAudio');
  if (btnAudio) {
    (btnAudio as HTMLElement).onclick = async () => {
      showToast('Abriendo audios…');
      const res = await pickAudioFiles();
      handleImportResult(res, 'Audio(s) añadido(s)', reopen);
    };
  }

  // Renombrar (delegado): ✏️ → input inline → guardar/cancelar.
  bodyEl.querySelectorAll('[data-rename-asset]').forEach((btn) => {
    (btn as HTMLElement).onclick = (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.renameAsset;
      const card = bodyEl.querySelector(`[data-asset-card="${id}"]`);
      const label = card?.querySelector('[data-asset-name]');
      if (!card || !label) return;
      const current = getCustomAssets().find((a) => a.id === id)?.name ?? '';
      label.innerHTML = `
        <span class="flex items-center gap-1.5" data-rename-box>
          <input data-rename-input value="${escapeHtml(current)}" maxlength="60"
            class="flex-1 min-w-0 px-2 py-1 rounded-lg bg-slate-900 border border-cyan-400/60 text-xs text-white outline-none" />
          <button data-rename-save class="px-2 py-1 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold">✓</button>
          <button data-rename-cancel class="px-2 py-1 rounded-lg bg-slate-700 text-slate-200 text-xs font-bold">✕</button>
        </span>`;
      const input = label.querySelector('[data-rename-input]') as HTMLInputElement | null;
      input?.focus();
      input?.select();
      const save = () => {
        const ok = renameCustomAsset(id, input?.value ?? '');
        showToast(ok ? `Renombrado a «${(input?.value ?? '').trim()}» ✏️` : 'El nombre no puede quedar vacío');
        if (ok) reopen();
      };
      label.querySelector('[data-rename-save]')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        save();
      });
      label.querySelector('[data-rename-cancel]')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        reopen();
      });
      input?.addEventListener('keydown', (ev) => {
        ev.stopPropagation();
        if (ev.key === 'Enter') save();
        if (ev.key === 'Escape') reopen();
      });
      input?.addEventListener('click', (ev) => ev.stopPropagation());
    };
  });

  // Etiquetas (delegado): ✏️ → input inline → guardar.
  bodyEl.querySelectorAll('[data-edit-tags]').forEach((btn) => {
    (btn as HTMLElement).onclick = (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.editTags;
      const box = bodyEl.querySelector(`[data-tags-box="${id}"]`);
      if (!box) return;
      const current = getCustomAssets().find((a) => a.id === id)?.tags ?? [];
      box.innerHTML = `
        <span class="flex items-center gap-1.5 w-full" data-tags-edit>
          <input data-tags-input value="${escapeHtml(current.join(', '))}" maxlength="120" placeholder="fondo, noche…"
            class="flex-1 min-w-0 px-2 py-1 rounded-lg bg-slate-900 border border-fuchsia-400/60 text-[11px] text-white outline-none" />
          <button data-tags-save class="px-2 py-1 rounded-lg bg-fuchsia-500 text-white text-xs font-bold">✓</button>
        </span>`;
      const input = box.querySelector('[data-tags-input]') as HTMLInputElement | null;
      input?.focus();
      const save = () => {
        const tags = normalizeTags((input?.value ?? '').split(','));
        setAssetTags(id, tags);
        showToast(tags.length ? `Etiquetas: ${tags.map((t) => `#${t}`).join(' ')} 🏷` : 'Etiquetas borradas 🏷');
        reopen();
      };
      box.querySelector('[data-tags-save]')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        save();
      });
      input?.addEventListener('keydown', (ev) => {
        ev.stopPropagation();
        if (ev.key === 'Enter') save();
        if (ev.key === 'Escape') reopen();
      });
      input?.addEventListener('click', (ev) => ev.stopPropagation());
    };
  });

  bodyEl.querySelectorAll('[data-remove-custom]').forEach((btn) => {
    (btn as HTMLElement).onclick = (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.removeCustom;
      const name = getCustomAssets().find((a) => a.id === id)?.name ?? 'recurso';
      if (!confirm(`¿Eliminar «${name}» de la carpeta?`)) return;
      removeCustomAsset(id);
      showToast('Recurso eliminado 🗑');
      reopen();
    };
  });
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
    animateTabSwitch(tabName);
    return;
  }

  // Editor de composición: pantalla completa independiente (no es un drawer).
  if (tabName === 'compositor' || tabName === 'composer') {
    try {
      document.getElementById('drawerModal')?.classList.add('hidden');
    } catch {}
    animateTabSwitch('compositor');
    window.dispatchEvent(new CustomEvent('vn:open-composer'));
    return;
  }

  const modal = document.getElementById('drawerModal');
  const titleEl = document.getElementById('drawerModalTitle');
  const bodyEl = document.getElementById('drawerModalBody');

  if (tabName === 'nodes') {
    titleEl.textContent = 'Añadir nodo nuevo al grafo';
    bodyEl.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button data-new-node="banner_scene" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-cyan-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-cyan-300 mb-1">🎬 Nodo de escena con pancarta</div>
          <div class="text-xs text-slate-400">Ilustración de escena 16:9 con puertos de hablante y diálogo.</div>
        </button>
        <button data-new-node="choice" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-rose-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-rose-300 mb-1">🔀 Nodo de decisión / elección</div>
          <div class="text-xs text-slate-400">Decisiones del jugador con ramificaciones color coral y cian.</div>
        </button>
        <button data-new-node="branch_scene" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-indigo-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-indigo-300 mb-1">💬 Nodo de diálogo con avatar</div>
          <div class="text-xs text-slate-400">Tarjeta compacta con miniatura para respuestas con ramificaciones.</div>
        </button>
        <button data-new-node="character_selector" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-emerald-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-emerald-300 mb-1">🎭 Nodo selector de personaje</div>
          <div class="text-xs text-slate-400">Carrusel de avatares, lista de expresiones y deslizadores de tamaño y posición.</div>
        </button>
        <button data-new-node="video_scene" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-fuchsia-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-fuchsia-300 mb-1">🎬 Bloque de vídeo</div>
          <div class="text-xs text-slate-400">Reproduce un vídeo de la carpeta (galería o archivos) y sigue la historia.</div>
        </button>
        <button data-new-node="sound_cue" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-amber-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-amber-300 mb-1">🔊 Nodo complemento de sonido</div>
          <div class="text-xs text-slate-400">Dispara un audio/efecto al entrar (música, ambiente o SFX) sin bloquear.</div>
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
    animateTabSwitch(tabName);
  } else if (tabName === 'assets') {
    titleEl.textContent = '📁 Carpeta de recursos';
    const catalog = allCharacterAssets();
    const all = getCustomAssets();
    const allTags = getAllAssetTags();
    const q = lastAssetsQuery.toLowerCase();
    const tagQ = lastAssetsTag.toLowerCase();
    const customs = all.filter((a) => {
      if (lastAssetsFilter !== 'todos' && a.kind !== lastAssetsFilter) return false;
      if (tagQ && !(a.tags ?? []).some((t) => t.toLowerCase() === tagQ)) return false;
      if (q) {
        const hay = `${a.name} ${(a.tags ?? []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const totalKB = all.reduce((s, a) => s + (a.size || 0), 0);
    bodyEl.innerHTML = `
      <div class="vn-anim-card rounded-2xl overflow-hidden border border-amber-400/30 bg-gradient-to-b from-[#1a1430] to-[#101528]">
        <div class="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border-b border-white/10">
          <div class="text-3xl">📁</div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold text-white truncate">/ Recursos <span class="text-slate-400 font-normal">· ${all.length} archivo(s)</span></div>
            <div class="text-[11px] text-slate-400">Carpeta del proyecto · ~${(totalKB / 1024).toFixed(1)} KB guardados · pulsa ➕ para añadir más sin salir</div>
          </div>
          <span class="text-[10px] px-2 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">${customs.length}/${all.length} visibles</span>
        </div>
        <div class="p-3.5 space-y-2.5">
          <div class="flex flex-col sm:flex-row gap-2">
            <input id="assetSearch" value="${escapeHtml(lastAssetsQuery)}" placeholder="🔍 Buscar por nombre o #etiqueta…"
              class="flex-1 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400/70" />
            <select id="assetFilter" class="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white outline-none">
              <option value="todos" ${lastAssetsFilter === 'todos' ? 'selected' : ''}>Todos</option>
              <option value="imagen" ${lastAssetsFilter === 'imagen' ? 'selected' : ''}>🖼 Imágenes</option>
              <option value="video" ${lastAssetsFilter === 'video' ? 'selected' : ''}>🎬 Vídeos</option>
              <option value="audio" ${lastAssetsFilter === 'audio' ? 'selected' : ''}>🎵 Audios</option>
            </select>
          </div>
          ${allTags.length ? `
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            <span class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">🏷 Etiquetas:</span>
            <button data-tag-filter="" class="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition min-h-[32px] ${!lastAssetsTag ? 'bg-fuchsia-500 text-white border-fuchsia-400' : 'bg-slate-800 text-slate-300 border-slate-600'}">Todas</button>
            ${allTags.map((t) => `
              <button data-tag-filter="${escapeHtml(t.tag)}" class="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition min-h-[32px] ${lastAssetsTag === t.tag ? 'bg-fuchsia-500 text-white border-fuchsia-400' : 'bg-slate-800 text-slate-300 border-slate-600'}">#${escapeHtml(t.tag)} · ${t.count}</button>
            `).join('')}
          </div>` : ''}
          <div class="flex flex-wrap gap-2">
            <button id="btnAddMoreFiles" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 transition active:scale-95 min-h-[44px]">
              ➕ Añadir más (archivos)
            </button>
            <button id="btnAddMoreGallery" class="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white transition active:scale-95 min-h-[44px]">
              🖼️ Galería
            </button>
            <button id="btnAddMoreVideo" class="px-4 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-xs font-bold text-white transition active:scale-95 min-h-[44px]">
              🎬 Vídeo
            </button>
            <button id="btnAddMoreAudio" class="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-xs font-bold text-white transition active:scale-95 min-h-[44px]">
              🎵 Audio
            </button>
            <button id="btnAddMoreCamera" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition active:scale-95 min-h-[44px]">
              📷 Cámara
            </button>
          </div>
          <p class="text-[11px] text-slate-400">En móvil: <b>Galería</b> abre tus fotos, <b>Vídeo</b> abre la galería de vídeos, <b>Audio</b>/<b>Archivos</b> abren el administrador y <b>Cámara</b> toma una foto. En web/PC se abre el explorador de archivos.</p>
        </div>
      </div>
      ${customs.length ? `
      <p class="text-xs text-slate-400 pt-3">Contenido de la carpeta — ✏️ renombra, 🏷 etiqueta, 🗑 elimina o pulsa para asignar al nodo seleccionado.</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
        ${customs.map(c => `
          <div data-asset-card="${c.id}" data-assign-char="${c.id}"
            class="vn-anim-card group relative p-2.5 rounded-xl bg-[#1d2442] hover:bg-[#27315a] border border-slate-700 hover:border-cyan-400/50 cursor-pointer text-center transition hover:-translate-y-0.5">
            ${assetPreviewHtml(c)}
            <div data-asset-name class="mt-2 text-xs font-bold text-white truncate px-1">${escapeHtml(c.name)}</div>
            <div class="text-[10px] text-slate-400">${c.kind === 'imagen' ? '🖼 Imagen' : c.kind === 'video' ? '🎬 Vídeo' : '🎵 Audio'} · ${assetSizeLabel(c.size)}</div>
            <div data-tags-box="${c.id}" class="mt-1.5 flex flex-wrap items-center justify-center gap-1 px-1">
              ${(c.tags ?? []).map((t) => `<button data-tag-filter="${escapeHtml(t)}" class="px-1.5 py-0.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-200 text-[10px] font-semibold">#${escapeHtml(t)}</button>`).join('') || `<span class="text-[10px] text-slate-500">sin etiquetas</span>`}
            </div>
            <div class="mt-1.5 flex items-center justify-center gap-1.5">
              <button data-rename-asset="${c.id}" title="Cambiar nombre" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 border border-slate-600 text-[11px] transition min-w-[44px] min-h-[36px]">✏️</button>
              <button data-edit-tags="${c.id}" title="Editar etiquetas" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-fuchsia-500 hover:text-white border border-slate-600 text-[11px] transition min-w-[44px] min-h-[36px]">🏷</button>
              <button data-remove-custom="${c.id}" title="Eliminar de la carpeta" class="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 hover:text-white border border-rose-500/40 text-[11px] transition min-w-[44px] min-h-[36px]">🗑</button>
            </div>
          </div>
        `).join('')}
      </div>` : `
      <div class="vn-anim-card mt-3 p-6 rounded-2xl border border-dashed border-slate-600 text-center">
        <div class="text-4xl mb-2">📂</div>
        <div class="text-sm font-bold text-white">Carpeta vacía</div>
        <p class="text-xs text-slate-400 mt-1">Usa ➕ Añadir más, 🖼️ Galería o 📷 Cámara para llenarla. Puedes seguir añadiendo más dentro de esta misma carpeta.</p>
      </div>`}
      <p class="text-xs text-slate-400 pt-3">Sprites incluidos (solo lectura):</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        ${Object.values(catalog).filter((c: any) => !c.custom).map((c: any) => `
          <div data-assign-char="${c.id}" class="vn-anim-card relative p-2.5 rounded-xl bg-[#1d2442] hover:bg-[#27315a] border border-slate-700/60 cursor-pointer text-center transition hover:-translate-y-0.5">
            <img src="${c.avatar}" loading="lazy" class="w-20 h-20 mx-auto rounded-xl object-cover mb-2 border border-white/15" />
            <div class="text-xs font-bold text-white truncate">${escapeHtml(c.name)}</div>
            <div class="text-[10px] text-cyan-300">${c.expressions.length} expresiones</div>
          </div>
        `).join('')}
      </div>
    `;
    modal.classList.remove('hidden');
    animateTabSwitch(tabName);

    const search = document.getElementById('assetSearch') as HTMLInputElement | null;
    const filter = document.getElementById('assetFilter') as HTMLSelectElement | null;
    search?.addEventListener('input', () => {
      lastAssetsQuery = search.value;
      const pos = search.selectionStart ?? search.value.length;
      openWorkspaceTab('assets');
      const again = document.getElementById('assetSearch') as HTMLInputElement | null;
      again?.focus();
      try { again?.setSelectionRange(pos, pos); } catch {}
    });
    filter?.addEventListener('change', () => {
      lastAssetsFilter = filter.value as 'todos' | 'imagen' | 'video' | 'audio';
      openWorkspaceTab('assets');
    });
    bodyEl.querySelectorAll('[data-tag-filter]').forEach((btn) => {
      (btn as HTMLElement).onclick = (e) => {
        e.stopPropagation();
        lastAssetsTag = (btn as HTMLElement).dataset.tagFilter ?? '';
        openWorkspaceTab('assets');
      };
    });

    wireFolderActions(() => openWorkspaceTab('assets'), 'assets');
    bodyEl.querySelectorAll('[data-assign-char]').forEach(card => {
      (card as HTMLElement).onclick = () => {
        // Si el clic vino de renombrar/eliminar, ese botón ya hizo stopPropagation.
        const node = ctx.state.nodes.find(n => n.id === ctx.selectedNodeId);
        const cId = (card as HTMLElement).dataset.assignChar;
        const catalogNow = allCharacterAssets();
        const customsNow = getCustomAssets();
        if (node && catalogNow[cId]) {
          pushHistory();
          node.characterId = cId;
          node.selectedCharId = cId;
          node.speaker = catalogNow[cId].name;
          renderNodes();
          showToast(`«${catalogNow[cId].name}» asignado al nodo seleccionado`);
        } else if (cId && customsNow.find((a) => a.id === cId && a.kind === 'audio')) {
          const a = customsNow.find((x) => x.id === cId);
          if (node) {
            pushHistory();
            node.audioAssetId = a.id;
            node.audioName = a.name;
            if (node.type === 'sound_cue') {
              node.soundAssetId = a.id;
              node.soundName = a.name;
            }
            renderNodes();
            showToast(`🎵 «${a.name}» asignado como audio del nodo`);
          } else {
            showToast('Selecciona primero un nodo para asignarle el audio');
            return;
          }
        } else if (cId && customsNow.find((a) => a.id === cId && a.kind === 'video')) {
          const a = customsNow.find((x) => x.id === cId);
          if (node) {
            pushHistory();
            node.videoAssetId = a.id;
            node.videoName = a.name;
            renderNodes();
            showToast(`🎬 «${a.name}» asignado como vídeo del nodo`);
          } else {
            showToast('Selecciona primero un nodo para asignarle el vídeo');
            return;
          }
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
            <div class="vn-anim-card flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#101528] border border-slate-700">
              <span class="font-mono text-xs text-cyan-300">${escapeHtml(k)}</span>
              <input data-var-key="${escapeHtml(k)}" value="${escapeHtml(String(v))}" class="w-28 px-2 py-1 rounded bg-slate-800 text-xs text-right text-white border border-slate-600" />
            </div>
          `).join('')}
        </div>
        <div class="flex gap-2 pt-2">
          <input id="newVarName" placeholder="nombre_variable" class="flex-1 px-3 py-2 rounded-xl bg-[#101528] border border-slate-700 text-xs text-white" />
          <input id="newVarVal" placeholder="true / 10" class="w-28 px-3 py-2 rounded-xl bg-[#101528] border border-slate-700 text-xs text-white" />
          <button id="btnAddVar" class="px-4 py-2 rounded-xl bg-cyan-500 text-xs font-bold text-slate-950 min-h-[44px]">+ Añadir</button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
    animateTabSwitch(tabName);
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
      <div class="vn-anim-card p-3.5 rounded-xl bg-[#101528] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2">
        <div class="text-xs text-slate-300">¿Quieres usar tus propias fotos como sprites? Añade más sin salir de esta carpeta.</div>
        <div class="flex flex-wrap gap-2">
          <button id="btnAddMoreFiles" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 transition min-h-[44px]">➕ Archivos</button>
          <button id="btnAddMoreGallery" class="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white transition min-h-[44px]">🖼️ Galería</button>
          <button id="btnAddMoreCamera" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition min-h-[44px]">📷 Cámara</button>
        </div>
      </div>
      <div class="space-y-3 pt-2">
        ${Object.values(catalog).map(c => `
          <div data-asset-card="${c.id}" class="vn-anim-card flex items-center gap-3.5 p-3 rounded-xl bg-[#101528] border border-slate-700/80 hover:border-cyan-400/40 transition">
            <img src="${c.avatar}" loading="lazy" class="w-14 h-14 rounded-xl object-cover border border-white/20 shrink-0" />
            <div class="flex-1 min-w-0">
              <div data-asset-name class="font-bold text-sm truncate" style="color:${c.color}">${escapeHtml(c.name)}${c.custom ? ' (tuyo)' : ''}</div>
              <div class="text-xs text-slate-400">Poses disponibles: ${c.expressions.join(' • ')}</div>
            </div>
            ${c.custom ? `
              <div class="flex gap-1.5 shrink-0">
                <button data-rename-asset="${c.id}" title="Cambiar nombre" class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-cyan-500 hover:text-slate-950 text-xs font-semibold text-slate-200 transition min-h-[44px]">✏️</button>
                <button data-remove-custom="${c.id}" title="Eliminar" class="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-xs font-semibold text-rose-300 transition min-h-[44px]">🗑</button>
              </div>` : ''}
          </div>
        `).join('')}
        ${customs.length ? '' : `<p class="text-[11px] text-slate-500">Consejo: en el móvil tienes Galería + Archivos + Cámara; en PC se abre el administrador de archivos.</p>`}
      </div>
    `;
    modal.classList.remove('hidden');
    animateTabSwitch(tabName);
    wireFolderActions(() => openWorkspaceTab('characters'), 'characters');
  } else if (tabName === 'settings') {
    titleEl.textContent = 'Ajustes globales y sintetizador de audio';
    bodyEl.innerHTML = `
      <div class="space-y-4">
        <div class="vn-anim-card p-3.5 rounded-xl bg-[#101528] border border-emerald-500/30">
          <div class="flex items-center justify-between gap-2">
            <div>
              <div class="font-semibold text-white text-sm">🔄 Actualizaciones automáticas</div>
              <div class="text-xs text-slate-400">La app revisa el último GitHub Release y te avisa con pantalla</div>
            </div>
            <span id="settingsAppVersion" class="text-[11px] font-mono px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 shrink-0">v…</span>
          </div>
          <label class="block mt-3">
            <span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Repo de releases (propietario/repo)</span>
            <input id="updateRepoInput" spellcheck="false"
              class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-400 min-h-[44px]" />
          </label>
          <div class="flex flex-wrap gap-2 mt-3">
            <button id="btnSettingsCheckUpdates" class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 min-h-[44px]">
              🔍 Buscar actualizaciones
            </button>
            <button id="btnSettingsSaveRepo" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 min-h-[44px]">
              Guardar repo
            </button>
          </div>
          <p class="text-[11px] text-slate-500 mt-2">Canal: workflow «Auto-update» (solo al publicar un release o manual, nunca por commits/PRs) adjunta al release el .zip de toda la app. En web descarga el .zip; en Tauri/Capacitor también lo guarda con diálogo nativo.</p>
        </div>
        <div class="vn-anim-card flex items-center justify-between p-3.5 rounded-xl bg-[#101528] border border-slate-700">
          <div>
            <div class="font-semibold text-white text-sm">Efectos de sonido de la interfaz y la novela</div>
            <div class="text-xs text-slate-400">Timbres Web Audio al conectar nodos o elegir opciones</div>
          </div>
          <button id="btnModalToggleSfx" class="px-4 py-1.5 rounded-lg text-xs font-bold min-h-[44px] ${ctx.sfxEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}">
            ${ctx.sfxEnabled ? 'Activado' : 'Silenciado'}
          </button>
        </div>
        <div class="vn-anim-card flex items-center justify-between p-3.5 rounded-xl bg-[#101528] border border-slate-700">
          <div>
            <div class="font-semibold text-white text-sm">Exportar proyecto como JSON</div>
            <div class="text-xs text-slate-400">Guarda tu grafo de nodos y variables como JSON</div>
          </div>
          <button id="btnDownloadJson" class="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white min-h-[44px]">
            Descargar .json
          </button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
    animateTabSwitch(tabName);
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
    // Auto-actualizaciones: versión visible + repo editable + chequeo manual.
    try {
      const vEl = document.getElementById('settingsAppVersion');
      if (vEl) vEl.textContent = `v${getCurrentVersion()}`;
      const repoInput = document.getElementById('updateRepoInput') as HTMLInputElement | null;
      if (repoInput) repoInput.value = getUpdateRepo();
      const btnCheck = document.getElementById('btnSettingsCheckUpdates');
      if (btnCheck) {
        (btnCheck as HTMLElement).onclick = async () => {
          (btnCheck as HTMLButtonElement).textContent = 'Buscando… 🔍';
          await checkForUpdates({ silent: false, manual: true });
          (btnCheck as HTMLButtonElement).textContent = '🔍 Buscar actualizaciones';
        };
      }
      const btnRepo = document.getElementById('btnSettingsSaveRepo');
      if (btnRepo) {
        (btnRepo as HTMLElement).onclick = () => {
          setUpdateRepo(repoInput?.value ?? '');
          showToast('Repo de actualizaciones guardado 🔄');
        };
      }
    } catch {}
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
  } else if (type === 'video_scene') {
    ctx.state.nodes.push({
      id,
      type: 'video_scene',
      badge: `Vídeo ${ctx.state.nodes.length + 1}`,
      x: offsetX,
      y: offsetY,
      width: 250,
      dialogue: 'Se reproduce el vídeo y continúa…',
      videoAutoplay: true,
      videoLoop: false,
      videoMuted: false,
      videoControls: true,
      inColor: 'cyan'
    });
  } else if (type === 'sound_cue') {
    ctx.state.nodes.push({
      id,
      type: 'sound_cue',
      badge: '🔊 Sonido',
      x: offsetX,
      y: offsetY,
      width: 240,
      dialogue: 'Complemento: suena y sigue sin bloquear.',
      volume: 100,
      loop: false,
      trigger: 'auto',
      inColor: 'cyan'
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
