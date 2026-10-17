<script lang="ts">
  import { onMount } from 'svelte';
  import {
    MAX_SLOTS,
    applyLoadedState,
    clearSlot,
    formatDate,
    getActiveSlot,
    loadAutosave,
    loadSlots,
    saveSlotState,
    type SaveSlot
  } from '../lib/studio/storage';
  import { PRESET_AOI, PRESET_SORA } from '../lib/studio/data/presets';
  import { buildCoverThumbnail } from '../lib/studio/cover';
  import type { VNState } from '../lib/types';

  export let onEnter: () => void = () => {};

  let slots: Array<SaveSlot | null> = [null, null, null];
  let autosave: { name: string; updatedAt: number; state: VNState; cover?: string } | null = null;
  let activeSlot: number | null = null;
  let newName = '';
  let newPreset: 'blank' | 'sora' | 'aoi' = 'blank';
  let newSlotName: string[] = ['', '', ''];
  let error = '';
  let notice = '';
  let noticeTimer: ReturnType<typeof setTimeout> | null = null;
  let query = '';
  let sortMode: 'recientes' | 'nombre' = 'recientes';
  let filterOccupied = false;

  type MenuView = 'proyectos' | 'nueva' | 'plantillas';
  let view: MenuView = 'proyectos';
  let menuOpen: number | 'auto' | null = null;
  let renaming: number | null = null;
  let renameValue = '';
  let fileInput: HTMLInputElement | null = null;

  const PRESETS = [
    { id: 'blank', icon: '✨', title: 'En blanco', desc: 'Lienzo vacío con escena inicial' },
    { id: 'sora', icon: '🌸', title: 'Ruta de Sora', desc: 'Historia de ejemplo con Sora' },
    { id: 'aoi', icon: '🌿', title: 'Encuentro con Aoi', desc: 'Historia de ejemplo con Aoi' }
  ] as const;

  function refresh() {
    slots = loadSlots();
    autosave = loadAutosave();
    activeSlot = getActiveSlot();
  }

  onMount(() => {
    refresh();
  });

  function cleanName(v: string, fallback: string): string {
    const t = (v || '').trim().slice(0, 60);
    return t || fallback;
  }

  function flashNotice(msg: string) {
    notice = msg;
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice = ''; }, 2600);
  }

  function blankState(name: string): VNState {
    return {
      projectName: name,
      zoom: 0.92,
      panX: 40,
      panY: 40,
      variables: { chapter: 1 },
      scenes: [{ id: 'escena_1', name: 'Escena 1', startNodeId: 'start_1', endNodeId: undefined }],
      nodes: [
        {
          id: 'start_1',
          type: 'banner_scene',
          badge: 'Escena inicial 1',
          sceneId: 'escena_1',
          x: 120,
          y: 120,
          width: 245,
          characterId: undefined,
          speaker: 'Narrador',
          speakerColor: '#94a3b8',
          dialogue: '¡Bienvenido a tu nueva novela visual!\nToca ✏️ y elige un personaje para empezar.',
          portsOut: [{ id: 'out_cyan', color: 'cyan', yOffset: 160 }]
        }
      ],
      wires: []
    };
  }

  function presetState(kind: 'blank' | 'sora' | 'aoi', name: string): VNState {
    if (kind === 'sora') {
      const s = JSON.parse(JSON.stringify(PRESET_SORA)) as VNState;
      s.projectName = name;
      return s;
    }
    if (kind === 'aoi') {
      const s = JSON.parse(JSON.stringify(PRESET_AOI)) as VNState;
      s.projectName = name;
      return s;
    }
    return blankState(name);
  }

  function enterWith(state: VNState, slotIndex: number | null) {
    error = '';
    try {
      applyLoadedState(state, { slotIndex });
      refresh();
      onEnter();
    } catch {
      error = 'No se pudo abrir la historia en este navegador.';
    }
  }

  function continueEditing() {
    if (!autosave) return;
    enterWith(autosave.state, activeSlot);
  }

  function createNew() {
    const name = cleanName(newName, 'Mi Novela');
    enterWith(presetState(newPreset, name), null);
  }

  function createFromPreset(id: 'blank' | 'sora' | 'aoi') {
    const name = cleanName(newName, id === 'blank' ? 'Mi Novela' : id === 'sora' ? 'Ruta de Sora' : 'Encuentro con Aoi');
    enterWith(presetState(id, name), null);
  }

  function createInSlot(i: number) {
    const name = cleanName(newSlotName[i], `Proyecto Sin Título`);
    const state = presetState('blank', name);
    try {
      saveSlotState(i, state, name);
    } catch {
      error = 'No se pudo guardar en este navegador (almacenamiento lleno o bloqueado).';
      return;
    }
    enterWith(state, i);
  }

  function editSlot(i: number) {
    const s = slots[i];
    if (!s) return;
    const name = cleanName(s.name, `Historia ${i + 1}`);
    try {
      saveSlotState(i, s.state, name);
    } catch {}
    enterWith(s.state, i);
  }

  function deleteSlot(i: number) {
    const s = slots[i];
    if (!s) return;
    if (!confirm(`¿Borrar «${s.name}» del slot ${i + 1}?`)) return;
    clearSlot(i);
    menuOpen = null;
    refresh();
  }

  function startRename(i: number) {
    const s = slots[i];
    if (!s) return;
    renaming = i;
    renameValue = s.name;
    menuOpen = null;
  }

  function commitRename(i: number) {
    const s = slots[i];
    if (!s || renaming !== i) return;
    const name = cleanName(renameValue, s.name);
    try {
      saveSlotState(i, s.state, name);
    } catch {
      error = 'No se pudo guardar el nombre en este navegador.';
      return;
    }
    renaming = null;
    refresh();
  }

  function occupiedSlots(): number {
    return slots.filter((s) => !!s).length;
  }

  function visibleSlots(): Array<{ s: SaveSlot | null; i: number }> {
    const rows = slots.map((s, i) => ({ s, i }));
    const withHits = rows.filter(({ s }) => {
      if (filterOccupied && !s) return false;
      return s ? matches(query, s.name) : !query.trim();
    });
    if (sortMode === 'nombre') {
      withHits.sort((a, b) => {
        if (!a.s && !b.s) return a.i - b.i;
        if (!a.s) return 1;
        if (!b.s) return -1;
        return a.s.name.localeCompare(b.s.name, 'es');
      });
    }
    return withHits;
  }

  function cycleSort() {
    sortMode = sortMode === 'recientes' ? 'nombre' : 'recientes';
    flashNotice(sortMode === 'nombre' ? 'Orden: por nombre' : 'Orden: recientes primero');
  }

  function toggleFilter() {
    filterOccupied = !filterOccupied;
    flashNotice(filterOccupied ? 'Filtro: solo proyectos creados' : 'Filtro: mostrando todos los slots');
  }

  function matches(q: string, name: string): boolean {
    const t = (q || '').trim().toLowerCase();
    if (!t) return true;
    return name.toLowerCase().includes(t);
  }

  // Portada: miniatura real del lienzo al guardar; si el registro es viejo
  // (sin cover) se genera al vuelo sin escribir.
  function coverOf(rec: { cover?: string; state: VNState } | null): string {
    if (!rec) return '';
    try {
      return rec.cover || buildCoverThumbnail(rec.state);
    } catch {
      return '';
    }
  }

  function importFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    if (input) input.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const payload = JSON.parse(String(rd.result ?? ''));
        if (!payload || !Array.isArray(payload.nodes)) throw new Error('formato');
        const state: VNState = {
          projectName: cleanName(payload.proyecto || 'Historia importada', 'Historia importada'),
          zoom: 0.92,
          panX: 40,
          panY: 40,
          variables: payload.variables ?? { chapter: 1 },
          scenes: Array.isArray(payload.scenes) && payload.scenes.length
            ? payload.scenes
            : [{ id: 'escena_1', name: 'Escena 1', startNodeId: payload.startNodeId, endNodeId: undefined }],
          nodes: payload.nodes,
          wires: Array.isArray(payload.wires) ? payload.wires : []
        };
        enterWith(state, null);
      } catch {
        error = 'Ese archivo no es una historia .vn.json válida.';
      }
    };
    rd.onerror = () => { error = 'No se pudo leer el archivo.'; };
    rd.readAsText(f);
  }

  function soon(section: string) {
    flashNotice(`«${section}» vive dentro del editor · Próximamente aquí`);
  }
</script>

<!-- Dashboard inicial estilo Novel Craft Studio -->
<div id="mainMenu" class="fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-[#111526] vn-grid-bg text-slate-100 select-none">
  <div class="min-h-full flex flex-col md:flex-row">
    <!-- Sidebar Izquierda -->
    <aside class="hidden md:flex flex-col w-[220px] shrink-0 border-r border-white/[0.07] bg-[#141829]/95 py-6">
      <!-- Logo Novel Craft Studio -->
      <div class="flex items-center gap-3 px-6 mb-7">
        <svg class="w-10 h-10 shrink-0 drop-shadow-[0_0_12px_rgba(56,189,248,0.35)]" viewBox="0 0 40 40" fill="none">
          <defs>
            <linearGradient id="ncLogoGrad1" x1="4" y1="6" x2="20" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#22d3ee" />
              <stop offset="100%" stop-color="#6366f1" />
            </linearGradient>
            <linearGradient id="ncLogoGrad2" x1="10" y1="8" x2="34" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="50%" stop-color="#a855f7" />
              <stop offset="100%" stop-color="#ec4899" />
            </linearGradient>
          </defs>
          <path d="M9 31V9" stroke="url(#ncLogoGrad1)" stroke-width="6.5" stroke-linecap="round" />
          <path d="M31 31V9" stroke="#a855f7" stroke-width="6.5" stroke-linecap="round" opacity="0.85" />
          <path d="M9 9L31 31" stroke="url(#ncLogoGrad2)" stroke-width="6.5" stroke-linecap="round" />
        </svg>
        <div class="leading-[1.18]">
          <span class="block text-[16px] font-bold text-white tracking-tight">Novel Craft</span>
          <span class="block text-[16px] font-bold text-white tracking-tight">Studio</span>
        </div>
      </div>

      <!-- Navegación principal -->
      <nav aria-label="Secciones" class="flex flex-col gap-1 text-[15px]">
        <button
          on:click={() => (view = 'proyectos')}
          class="relative flex items-center gap-3.5 px-6 py-3 text-left transition min-h-[46px]
            {view === 'proyectos'
              ? 'bg-gradient-to-r from-[#1c2541]/40 via-[#1f2d52]/80 to-[#22d3ee]/20 text-white font-medium'
              : 'text-[#949ec2] hover:text-white hover:bg-white/[0.03]'}"
        >
          {#if view === 'proyectos'}
            <span class="absolute right-0 top-1 bottom-1 w-[3.5px] rounded-l-full bg-[#22d3ee] shadow-[0_0_14px_#22d3ee,0_0_24px_#22d3ee]"></span>
          {/if}
          <svg class="w-5 h-5 shrink-0 {view === 'proyectos' ? 'text-[#22d3ee] drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]' : 'text-[#22d3ee]/80'}" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <span>Proyectos</span>
        </button>

        <button
          on:click={() => (view = 'plantillas')}
          class="relative flex items-center gap-3.5 px-6 py-3 text-left transition min-h-[46px]
            {view === 'plantillas'
              ? 'bg-gradient-to-r from-[#1c2541]/40 via-[#1f2d52]/80 to-[#22d3ee]/20 text-white font-medium'
              : 'text-[#949ec2] hover:text-white hover:bg-white/[0.03]'}"
        >
          {#if view === 'plantillas'}
            <span class="absolute right-0 top-1 bottom-1 w-[3.5px] rounded-l-full bg-[#22d3ee] shadow-[0_0_14px_#22d3ee]"></span>
          {/if}
          <svg class="w-5 h-5 shrink-0 text-[#f87171]/85" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
            <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
            <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
            <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
          </svg>
          <span>Plantillas</span>
        </button>

        <button on:click={() => soon('Recursos')} class="flex items-center gap-3.5 px-6 py-3 text-left text-[#949ec2] hover:text-white hover:bg-white/[0.03] transition min-h-[46px]">
          <svg class="w-5 h-5 shrink-0 text-[#94a3b8]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 3v5h5" />
          </svg>
          <span>Recursos</span>
        </button>

        <button on:click={() => soon('Comunidad')} class="flex items-center gap-3.5 px-6 py-3 text-left text-[#949ec2] hover:text-white hover:bg-white/[0.03] transition min-h-[46px]">
          <svg class="w-5 h-5 shrink-0 text-[#a78bfa]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 20a6 6 0 0112 0M17 7a3 3 0 110 6M21 20a5 5 0 00-4-4.9" />
          </svg>
          <span>Comunidad</span>
        </button>

        <button on:click={() => soon('Tutoriales')} class="flex items-center gap-3.5 px-6 py-3 text-left text-[#949ec2] hover:text-white hover:bg-white/[0.03] transition min-h-[46px]">
          <svg class="w-5 h-5 shrink-0 text-[#a78bfa]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.5c-2.2-1.4-5.2-1.8-8-1v13c2.8-.8 5.8-.4 8 1 2.2-1.4 5.2-1.8 8-1v-13c-2.8-.8-5.8-.4-8 1z" />
          </svg>
          <span>Tutoriales</span>
        </button>
      </nav>

      <!-- Parte inferior del Sidebar -->
      <div class="mt-auto flex flex-col gap-1 pt-6 text-[15px]">
        <button on:click={() => soon('Ajustes')} class="flex items-center gap-3.5 px-6 py-2.5 text-left text-[#949ec2] hover:text-white hover:bg-white/[0.03] transition min-h-[44px]">
          <svg class="w-5 h-5 shrink-0 text-[#a855f7]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.6.77 1.02 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          <span>Ajustes</span>
        </button>

        <button on:click={() => soon('Ayuda')} class="flex items-center gap-3.5 px-6 py-2.5 text-left text-[#949ec2] hover:text-white hover:bg-white/[0.03] transition min-h-[44px]">
          <svg class="w-5 h-5 shrink-0 text-[#8e96b8]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M12 16.5h.01" />
          </svg>
          <span>Ayuda</span>
        </button>
      </div>
    </aside>

    <!-- Columna Principal -->
    <div class="flex-1 min-w-0 flex flex-col">
      <!-- Barra superior (Topbar) -->
      <header class="flex items-center gap-2.5 sm:gap-3.5 px-5 sm:px-8 py-3.5 border-b border-white/[0.07] bg-[#141829]/75 backdrop-blur-md">
        <!-- Logo compacto en móvil -->
        <span class="md:hidden w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-base font-black text-white shrink-0">N</span>

        <!-- Buscador -->
        <div class="relative flex-1 max-w-[490px] min-w-0">
          <svg class="w-5 h-5 text-[#7c85a6] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path stroke-linecap="round" d="M20 20l-3.5-3.5" />
          </svg>
          <input
            bind:value={query}
            maxlength="60"
            placeholder="Buscar proyecto..."
            aria-label="Buscar proyecto"
            class="w-full rounded-full bg-[#1d2238]/90 border border-[#343b59] pl-10 pr-4 py-2 text-[14px] text-white placeholder:text-[#7c85a6] outline-none focus:border-[#38bdf8]/70 transition min-h-[40px]"
          />
        </div>

        <div class="flex items-center gap-2.5 ml-auto shrink-0">
          <!-- Botón Filtrar -->
          <button
            on:click={toggleFilter}
            aria-label="Filtrar proyectos"
            title="Filtrar proyectos"
            class="hidden sm:flex w-12 h-11 rounded-full bg-[#20263e] border border-[#3b4366] items-center justify-center text-[#949ec2] hover:text-white hover:border-slate-400 transition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24">
              <path d="M4 7h16M7 12h10M10 17h4" />
            </svg>
          </button>

          <!-- Botón Ordenar -->
          <button
            on:click={cycleSort}
            aria-label="Cambiar orden"
            title={sortMode === 'nombre' ? 'Orden: por nombre' : 'Orden: recientes primero'}
            class="hidden sm:flex w-12 h-11 rounded-full bg-[#20263e] border border-[#3b4366] items-center justify-center text-[#949ec2] hover:text-white hover:border-slate-400 transition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path d="M8 18V6M8 6L5 9M8 6l3 3M16 6v12m0 0l-3-3m3 3l3-3" />
            </svg>
          </button>

          <!-- Botón Importar -->
          <button
            on:click={() => fileInput?.click()}
            class="flex items-center gap-2 px-4 sm:px-5 h-11 rounded-full bg-[#20263e] border border-[#454e75] text-[14px] font-medium text-[#cbd5e1] hover:text-white hover:border-[#38bdf8]/60 transition"
          >
            <svg class="w-5 h-5 text-[#818cf8]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path d="M12 4v11m0 0l-3.5-3.5M12 15l3.5-3.5M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" />
            </svg>
            <span class="hidden sm:inline">Importar</span>
          </button>

          <!-- Avatar de usuario -->
          <div class="w-11 h-11 rounded-full p-[1.5px] bg-gradient-to-br from-slate-300/60 to-indigo-400/40 shrink-0 shadow-md" title="Creador" aria-label="Perfil de creador">
            <!-- Icono oficial user-round de Lucide (lucide.dev · ISC) -->
            <div class="w-full h-full rounded-full bg-[#20263e] flex items-center justify-center">
              <svg class="w-6 h-6 text-[#cbd5e1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <input bind:this={fileInput} type="file" accept=".vn.json,application/json" class="hidden" aria-hidden="true" on:change={importFile} />

      <!-- Área Principal -->
      <main class="flex-1 px-5 sm:px-8 py-6">
        {#if error}
          <p class="mb-4 max-w-3xl text-xs text-amber-200 bg-amber-400/10 border border-amber-400/40 rounded-xl px-4 py-2.5">{error}</p>
        {/if}
        {#if notice}
          <p class="mb-4 max-w-3xl text-xs text-cyan-200 bg-cyan-400/10 border border-cyan-400/40 rounded-xl px-4 py-2.5">{notice}</p>
        {/if}

        {#if view === 'proyectos'}
          <h1 class="text-[26px] font-bold text-white tracking-tight mb-5">Mis Proyectos</h1>

          {#snippet coverPh()}
            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#232a45] to-[#141829]">
              <svg class="w-14 h-14 text-slate-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="1.6" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 17l4.5-4.5 3 3 3.5-3.5L19.5 16" />
              </svg>
            </div>
          {/snippet}

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[1040px]">
            <!-- Tarjeta 1: Nuevo Proyecto con borde Neón -->
            <button
              on:click={() => (view = 'nueva')}
              class="new-project-card group rounded-[20px] p-5 text-center flex flex-col items-center justify-center min-h-[220px] transition-transform duration-200 hover:scale-[1.015]"
            >
              <svg class="w-16 h-16 mb-3 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 64 64" fill="none">
                <defs>
                  <linearGradient id="plusGradH" x1="14" y1="32" x2="50" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#fb923c" />
                    <stop offset="45%" stop-color="#ec4899" />
                    <stop offset="100%" stop-color="#a855f7" />
                  </linearGradient>
                  <linearGradient id="plusGradV" x1="32" y1="14" x2="32" y2="50" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#a855f7" />
                    <stop offset="50%" stop-color="#38bdf8" />
                    <stop offset="100%" stop-color="#22d3ee" />
                  </linearGradient>
                </defs>
                <path d="M16 32H48" stroke="url(#plusGradH)" stroke-width="5" stroke-linecap="round" />
                <path d="M32 16V48" stroke="url(#plusGradV)" stroke-width="5" stroke-linecap="round" />
              </svg>
              <span class="block text-[19px] font-bold text-white tracking-tight">Nuevo Proyecto</span>
              <span class="block text-[13.5px] text-[#949ec2] mt-1">Comenzar desde cero</span>
            </button>

            <!-- Tarjeta 2: Sesión actual (Autosave) -->
            {#if autosave && matches(query, autosave.name)}
              <div class="project-card relative rounded-[20px] bg-[#1b2035]/90 border border-[#323956] p-3 flex flex-col justify-between min-h-[220px] transition-all hover:border-[#4b5682] hover:shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
                <button on:click={continueEditing} class="block w-full text-left flex-1 flex flex-col" aria-label={`Abrir ${autosave.name}`}>
                  <!-- Miniatura real del lienzo donde se quedó -->
                  <div class="relative w-full h-[126px] rounded-xl overflow-hidden bg-[#141829] border border-white/10">
                    {#if coverOf(autosave)}
                      <img src={coverOf(autosave)} alt="" class="w-full h-full object-cover" />
                    {:else}
                      {@render coverPh()}
                    {/if}
                  </div>

                  <!-- Pie de tarjeta -->
                  <div class="pt-3 px-1 flex items-center justify-between gap-2">
                    <span class="text-[18px] font-bold text-white truncate">{autosave.name}</span>
                    <span class="shrink-0 text-[11px] px-2.5 py-0.5 rounded-md bg-[#2a304d] text-[#cbd5e1] border border-white/10 font-medium">
                      En edición
                    </span>
                  </div>
                  <span class="block px-1 text-[13px] text-[#8e96b8] truncate mt-0.5">
                    Última edición: {formatDate(autosave.updatedAt)}
                  </span>
                </button>

                <!-- Botón ⋯ en esquina superior derecha de la miniatura -->
                <button
                  on:click|stopPropagation={() => (menuOpen = menuOpen === 'auto' ? null : 'auto')}
                  aria-label="Opciones de sesión actual"
                  class="absolute top-5 right-5 w-8 h-7 rounded-lg bg-[#191e30]/80 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-[#252b42] transition"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="4.5" cy="10" r="1.6" />
                    <circle cx="10" cy="10" r="1.6" />
                    <circle cx="15.5" cy="10" r="1.6" />
                  </svg>
                </button>

                {#if menuOpen === 'auto'}
                  <div class="absolute top-13 right-4 rounded-xl bg-[#111526] border border-slate-600/80 shadow-2xl py-1 w-44 z-20">
                    <button on:click={() => { menuOpen = null; continueEditing(); }} class="block w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10">
                      ▶ Continuar editando
                    </button>
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Slots de proyectos (Ocupados y Vacíos) -->
            {#each visibleSlots() as { s: slot, i }}
              {#if slot && matches(query, slot.name)}
                <div class="project-card relative rounded-[20px] bg-[#1b2035]/90 border border-[#323956] p-3 flex flex-col justify-between min-h-[220px] transition-all hover:border-[#4b5682] hover:shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
                  <button on:click={() => editSlot(i)} class="block w-full text-left flex-1 flex flex-col" aria-label={`Abrir ${slot.name}`}>
                    <!-- Miniatura real del lienzo donde se quedó -->
                    <div class="relative w-full h-[126px] rounded-xl overflow-hidden bg-[#141829] border border-white/10">
                      {#if coverOf(slot)}
                        <img src={coverOf(slot)} alt="" class="w-full h-full object-cover" />
                      {:else}
                        {@render coverPh()}
                      {/if}
                    </div>

                    <!-- Título y fecha -->
                    <div class="pt-3 px-1 flex items-center justify-between gap-2">
                      <span class="text-[18px] font-bold text-white truncate">{slot.name}</span>
                      {#if activeSlot === i}
                        <span class="shrink-0 text-[11px] px-2.5 py-0.5 rounded-md bg-[#2a304d] text-[#cbd5e1] border border-white/10 font-medium">
                          En edición
                        </span>
                      {/if}
                    </div>
                    <span class="block px-1 text-[13px] text-[#8e96b8] truncate mt-0.5">
                      Última edición: {formatDate(slot.updatedAt)}
                    </span>
                  </button>

                  <!-- Botón de menú ⋯ -->
                  <button
                    on:click|stopPropagation={() => (menuOpen = menuOpen === i ? null : i)}
                    aria-label={`Opciones de ${slot.name}`}
                    class="absolute top-5 right-5 w-8 h-7 rounded-lg bg-[#191e30]/80 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-[#252b42] transition"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="4.5" cy="10" r="1.6" />
                      <circle cx="10" cy="10" r="1.6" />
                      <circle cx="15.5" cy="10" r="1.6" />
                    </svg>
                  </button>

                  {#if menuOpen === i}
                    <div class="absolute top-13 right-4 rounded-xl bg-[#111526] border border-slate-600/80 shadow-2xl py-1 w-44 z-20">
                      <button on:click={() => { menuOpen = null; editSlot(i); }} class="block w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10">▶ Abrir</button>
                      <button on:click={() => startRename(i)} class="block w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10">✏️ Cambiar nombre</button>
                      <button on:click={() => deleteSlot(i)} class="block w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20">🗑 Borrar</button>
                    </div>
                  {/if}

                  {#if renaming === i}
                    <div class="pt-2 flex gap-2">
                      <input
                        bind:value={renameValue}
                        maxlength="60"
                        aria-label="Nuevo nombre"
                        class="flex-1 min-w-0 rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-400"
                      />
                      <button on:click={() => commitRename(i)} class="px-3.5 py-1.5 rounded-xl bg-cyan-400 text-xs font-bold text-slate-950">OK</button>
                    </div>
                  {/if}
                </div>
              {:else if !slot && !query.trim()}
                <!-- Tarjeta de Slot Vacío con el diseño exacto de "Proyecto Sin Título" -->
                <button
                  on:click={() => createInSlot(i)}
                  class="project-card group relative rounded-[20px] bg-[#1b2035]/90 border border-[#323956] p-3 text-left flex flex-col justify-between min-h-[220px] transition-all hover:border-[#4b5682] hover:shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
                  aria-label={`Crear proyecto en el slot ${i + 1}`}
                >
                  <div class="w-full h-[126px] rounded-xl bg-[#242a42]/90 border border-[#3b4363] flex items-center justify-center">
                    <!-- Icono de galería / imagen vacía -->
                    <svg class="w-16 h-16 text-[#3d4566] group-hover:text-[#515b85] transition-colors" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="14" y="18" width="38" height="30" rx="5" />
                      <path d="M18 14h32a5 5 0 015 5v24" opacity="0.55" />
                      <circle cx="39" cy="27" r="3.5" />
                      <path d="M15 42l11-11 9 9 7-6 10 9" />
                    </svg>
                  </div>

                  <div class="pt-3 px-1">
                    <span class="block text-[18px] font-bold text-white truncate">Proyecto Sin Título</span>
                    <span class="block text-[13px] text-[#8e96b8] truncate mt-0.5">
                      Slot {i + 1} disponible · Toca para crear
                    </span>
                  </div>
                </button>
              {/if}
            {/each}
          </div>
        {/if}

        {#if view === 'nueva'}
          <h1 class="text-[26px] font-bold text-white tracking-tight mb-5">Nuevo Proyecto</h1>
          <div class="max-w-xl rounded-[20px] bg-[#1b2035]/95 border border-[#38bdf8]/35 shadow-2xl p-6">
            <p class="text-sm text-[#949ec2] mb-4">Ponle nombre a tu historia y elige una plantilla base para comenzar.</p>
            <input
              bind:value={newName}
              maxlength="60"
              placeholder="Ej: Mi Novela..."
              aria-label="Nombre de la historia nueva"
              class="w-full rounded-xl bg-[#111526] border border-[#343b59] px-4 py-2.5 text-sm text-white outline-none focus:border-[#38bdf8] mb-3 min-h-[44px]"
            />
            <div class="flex items-center gap-3 mb-5">
              <label for="newPreset" class="text-sm text-[#949ec2] shrink-0">Plantilla:</label>
              <select
                id="newPreset"
                bind:value={newPreset}
                class="flex-1 min-w-0 rounded-xl bg-[#111526] border border-[#343b59] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#38bdf8] min-h-[44px]"
              >
                <option value="blank">✨ En blanco</option>
                <option value="sora">🌸 Ruta de Sora</option>
                <option value="aoi">🌿 Encuentro con Aoi</option>
              </select>
            </div>
            <div class="flex gap-3">
              <button
                on:click={createNew}
                class="flex-1 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#22d3ee] via-[#818cf8] to-[#e879f9] text-sm font-semibold text-white shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:brightness-110 transition min-h-[44px]"
              >
                Crear historia
              </button>
              <button
                on:click={() => (view = 'proyectos')}
                class="px-5 py-2.5 rounded-full bg-[#20263e] border border-[#454e75] text-sm font-medium text-[#cbd5e1] hover:text-white transition min-h-[44px]"
              >
                ← Volver
              </button>
            </div>
          </div>
        {/if}

        {#if view === 'plantillas'}
          <h1 class="text-[26px] font-bold text-white tracking-tight mb-5">Plantillas</h1>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-[1040px]">
            {#each PRESETS as p}
              <button
                on:click={() => createFromPreset(p.id)}
                class="rounded-[20px] bg-[#1b2035]/90 border border-[#323956] p-3 text-left transition-all hover:border-[#38bdf8]/60 hover:scale-[1.01]"
              >
                <span class="flex items-center justify-center h-[126px] rounded-xl bg-gradient-to-br from-indigo-500/25 via-[#202744] to-[#13182b] border border-white/10 text-5xl">
                  {p.icon}
                </span>
                <span class="block px-1 pt-3 pb-1">
                  <span class="block text-[18px] font-bold text-white">{p.title}</span>
                  <span class="block text-[13px] text-[#8e96b8] mt-0.5">{p.desc}</span>
                </span>
              </button>
            {/each}
          </div>
        {/if}
      </main>
    </div>
  </div>
</div>

<style>
  /* Fondo de cuadrícula oscura con puntos sutiles como en la referencia */
  .vn-grid-bg {
    background-color: #111526;
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      radial-gradient(circle, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
    background-size: 48px 48px, 48px 48px, 24px 24px;
    background-position: 0 0, 0 0, 12px 12px;
  }

  /* Tarjeta Nuevo Proyecto con borde degradado neón y halo exterior */
  .new-project-card {
    background:
      linear-gradient(145deg, rgba(31, 38, 64, 0.94) 0%, rgba(22, 27, 46, 0.96) 100%) padding-box,
      linear-gradient(135deg, #f472b6 0%, #c084fc 35%, #22d3ee 70%, #e879f9 100%) border-box;
    border: 2.2px solid transparent;
    box-shadow:
      0 0 26px rgba(236, 72, 153, 0.28),
      0 0 32px rgba(34, 211, 238, 0.22),
      inset 0 0 24px rgba(56, 189, 248, 0.08);
  }
</style>