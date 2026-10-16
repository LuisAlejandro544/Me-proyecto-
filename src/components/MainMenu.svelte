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
  import type { VNState } from '../lib/types';

  export let onEnter: () => void = () => {};

  let slots: Array<SaveSlot | null> = [null, null, null];
  let autosave: { name: string; updatedAt: number; state: VNState } | null = null;
  let activeSlot: number | null = null;
  let newName = '';
  let newPreset: 'blank' | 'sora' | 'aoi' = 'blank';
  let newSlotName: string[] = ['', '', ''];
  let error = '';
  let notice = '';
  let noticeTimer: ReturnType<typeof setTimeout> | null = null;
  let query = '';
  // Orden de las tarjetas: por recientes o por nombre.
  let sortMode: 'recientes' | 'nombre' = 'recientes';

  // Vista del dashboard: grid de proyectos, formulario de nueva o plantillas.
  type MenuView = 'proyectos' | 'nueva' | 'plantillas';
  let view: MenuView = 'proyectos';
  // Tarjeta con el menú ⋯ abierto (índice de slot o 'auto').
  let menuOpen: number | 'auto' | null = null;
  // Slot en edición de nombre desde el menú ⋯.
  let renaming: number | null = null;
  let renameValue = '';
  let fileInput: HTMLInputElement | null = null;

  const PRESETS = [
    { id: 'blank', icon: '✨', title: 'En blanco', desc: 'Lienzo vacío con escena inicial' },
    { id: 'sora', icon: '🌸', title: 'Ruta de Sora', desc: 'Historia de ejemplo con Sora' },
    { id: 'aoi', icon: '🌿', title: 'Encuentro con Aoi', desc: 'Historia de ejemplo con Aoi' }
  ] as const;

  const COVERS = [
    'from-indigo-500/40 via-[#1b2342] to-[#0f1428]',
    'from-cyan-500/40 via-[#1b2342] to-[#0f1428]',
    'from-emerald-500/40 via-[#1b2342] to-[#0f1428]',
    'from-fuchsia-500/40 via-[#1b2342] to-[#0f1428]'
  ];
  const COVER_ICONS = ['🎭', '🌸', '🌲', '🏫'];

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
    const name = cleanName(newSlotName[i], `Historia ${i + 1}`);
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

  function slotMeta(s: SaveSlot): string {
    const n = s.state.nodes.length;
    return `${n} nodo(s) · ${formatDate(s.updatedAt)}`;
  }

  function occupiedSlots(): number {
    return slots.filter((s) => !!s).length;
  }

  // Slots con su índice original, filtrados por búsqueda y ordenados.
  function visibleSlots(): Array<{ s: SaveSlot | null; i: number }> {
    const rows = slots.map((s, i) => ({ s, i }));
    const withHits = rows.filter(({ s }) => (s ? matches(query, s.name) : !query.trim()));
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

  function matches(q: string, name: string): boolean {
    const t = (q || '').trim().toLowerCase();
    if (!t) return true;
    return name.toLowerCase().includes(t);
  }

  // Importar .vn.json exportado (formato de buildHistoria): se mapea a VNState.
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

<!-- Dashboard inicial estilo Novel Craft: sidebar + buscador + grid de proyectos -->
<div id="mainMenu" class="fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-[#0d1124] vn-canvas-bg">
  <div class="min-h-full flex flex-col md:flex-row">
    <!-- Sidebar -->
    <aside class="hidden md:flex flex-col w-60 shrink-0 border-r border-slate-700/40 bg-[#101528]/90 px-4 py-5 gap-1">
      <div class="flex items-center gap-2.5 px-2 mb-6">
        <span class="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-xl font-black text-white shadow-lg">N</span>
        <span class="leading-tight">
          <span class="block text-sm font-bold text-white">Novel Craft</span>
          <span class="block text-sm font-bold text-white">Studio</span>
        </span>
      </div>
      <nav aria-label="Secciones" class="flex flex-col gap-1 text-[15px]">
        <button on:click={() => (view = 'proyectos')}
          class={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition min-h-[44px] ${view === 'proyectos' ? 'text-white font-semibold' : 'text-slate-400 hover:text-white'}`}>
          {#if view === 'proyectos'}<span class="absolute right-0 top-1.5 bottom-1.5 w-1 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.8)]"></span>{/if}
          <span class="text-lg w-6 text-center">📁</span> Proyectos
        </button>
        <button on:click={() => (view = 'plantillas')}
          class={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition min-h-[44px] ${view === 'plantillas' ? 'text-white font-semibold' : 'text-slate-400 hover:text-white'}`}>
          {#if view === 'plantillas'}<span class="absolute right-0 top-1.5 bottom-1.5 w-1 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.8)]"></span>{/if}
          <span class="text-lg w-6 text-center">▦</span> Plantillas
        </button>
        {#each [['🖼️', 'Recursos'], ['👥', 'Comunidad'], ['📖', 'Tutoriales']] as [icon, label]}
          <button on:click={() => soon(label)} class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-400 hover:text-white transition min-h-[44px]">
            <span class="text-lg w-6 text-center">{icon}</span> {label}
          </button>
        {/each}
      </nav>
      <div class="mt-auto flex flex-col gap-1 pt-6">
        {#each [['⚙️', 'Ajustes'], ['❓', 'Ayuda']] as [icon, label]}
          <button on:click={() => soon(label)} class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-400 hover:text-white transition min-h-[44px] text-[15px]">
            <span class="text-lg w-6 text-center">{icon}</span> {label}
          </button>
        {/each}
      </div>
    </aside>

    <!-- Columna principal -->
    <div class="flex-1 min-w-0 flex flex-col">
      <!-- Topbar: logo móvil + buscador + importar + avatar -->
      <header class="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 border-b border-slate-700/40">
        <span class="md:hidden w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-base font-black text-white shrink-0">N</span>
        <div class="relative flex-1 min-w-0">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input bind:value={query} maxlength="60" placeholder="Buscar proyecto…" aria-label="Buscar proyecto"
            class="w-full rounded-full bg-[#161c33] border border-slate-700/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/60 min-h-[44px]" />
        </div>
        <button on:click={cycleSort} aria-label="Cambiar orden" title={sortMode === 'nombre' ? 'Orden: por nombre' : 'Orden: recientes primero'}
          class="hidden sm:flex w-11 h-11 rounded-full bg-[#161c33] border border-slate-700/70 items-center justify-center text-slate-300 hover:text-white transition shrink-0">⇅</button>
        <button on:click={() => fileInput?.click()} class="flex items-center gap-2 px-4 sm:px-5 h-11 rounded-full bg-[#161c33] border border-slate-600 text-sm font-semibold text-slate-200 hover:text-white hover:border-cyan-400/60 transition shrink-0">
          ⬇ <span class="hidden sm:inline">Importar</span>
        </button>
        <span class="w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 to-rose-400 flex items-center justify-center text-lg shrink-0" title="Creador">👤</span>
      </header>
      <input bind:this={fileInput} type="file" accept=".vn.json,application/json" class="hidden" aria-hidden="true" on:change={importFile} />

      <main class="flex-1 px-4 sm:px-6 py-5">
        {#if error}
          <p class="mb-4 max-w-3xl text-xs text-amber-200 bg-amber-400/10 border border-amber-400/40 rounded-xl px-4 py-2.5">{error}</p>
        {/if}
        {#if notice}
          <p class="mb-4 max-w-3xl text-xs text-cyan-200 bg-cyan-400/10 border border-cyan-400/40 rounded-xl px-4 py-2.5">{notice}</p>
        {/if}

        {#if view === 'proyectos'}
          <h1 class="text-2xl sm:text-3xl font-bold text-white mb-4">Mis Proyectos</h1>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-w-5xl">
            <!-- Nuevo proyecto: borde neón -->
            <button on:click={() => (view = 'nueva')}
              class="rounded-2xl p-[2px] bg-gradient-to-br from-pink-500 via-cyan-400 to-fuchsia-500 text-left transition hover:scale-[1.01] min-h-[44px]">
              <span class="flex flex-col items-center justify-center gap-1 rounded-[14px] bg-[#161c33] px-4 py-8 h-full">
                <span class="text-5xl font-light bg-gradient-to-br from-amber-300 via-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">+</span>
                <span class="text-lg font-bold text-white mt-2">Nuevo Proyecto</span>
                <span class="text-xs text-slate-400">Comenzar desde cero</span>
              </span>
            </button>

            <!-- Sesión actual -->
            {#if autosave && matches(query, autosave.name)}
              <button on:click={continueEditing} class="rounded-2xl overflow-hidden bg-[#1a2138] border border-slate-700/60 text-left transition hover:border-cyan-400/50 hover:scale-[1.01] min-h-[44px]">
                <span class={`relative flex items-center justify-center h-28 bg-gradient-to-br ${COVERS[0].split(' ')[0]} via-[#1b2342] to-[#0f1428]`}>
                  <span class="text-5xl">🎭</span>
                  <span class="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 font-bold">En edición</span>
                </span>
                <span class="block px-4 py-3">
                  <span class="block text-base font-bold text-white truncate">«{autosave.name}»</span>
                  <span class="block text-xs text-slate-400 truncate">Última edición: {formatDate(autosave.updatedAt)} · {autosave.state.nodes.length} nodo(s)</span>
                </span>
              </button>
            {/if}

            <!-- Slots -->
            {#each visibleSlots() as { s: slot, i }}
              {#if slot && matches(query, slot.name)}
                <div class="relative rounded-2xl overflow-hidden bg-[#1a2138] border border-slate-700/60 transition hover:border-cyan-400/50">
                  <button on:click={() => editSlot(i)} class="block w-full text-left min-h-[44px]" aria-label={`Abrir ${slot.name}`}>
                    <span class={`flex items-center justify-center h-28 bg-gradient-to-br ${COVERS[(i + 1) % COVERS.length].split(' ')[0]} via-[#1b2342] to-[#0f1428]`}>
                      <span class="text-5xl">{COVER_ICONS[(i + 1) % COVER_ICONS.length]}</span>
                    </span>
                    <span class="block px-4 py-3 pr-12">
                      <span class="block text-base font-bold text-white truncate">{slot.name}</span>
                      <span class="block text-xs text-slate-400 truncate">Última edición: {slotMeta(slot)}</span>
                      {#if activeSlot === i}
                        <span class="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">● ACTIVO</span>
                      {/if}
                    </span>
                  </button>
                  <button on:click={() => (menuOpen = menuOpen === i ? null : i)} aria-label={`Opciones de ${slot.name}`}
                    class="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/55 text-slate-200 font-bold hover:text-white transition">⋯</button>
                  {#if menuOpen === i}
                    <div class="absolute top-12 right-2 rounded-xl bg-[#0f1428] border border-slate-600 shadow-xl py-1 w-44 z-10">
                      <button on:click={() => { menuOpen = null; editSlot(i); }} class="block w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700/60 min-h-[44px]">▶ Abrir</button>
                      <button on:click={() => startRename(i)} class="block w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700/60 min-h-[44px]">✏️ Cambiar nombre</button>
                      <button on:click={() => deleteSlot(i)} class="block w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 min-h-[44px]">🗑 Borrar</button>
                    </div>
                  {/if}
                  {#if renaming === i}
                    <div class="px-4 pb-3 flex gap-2">
                      <input bind:value={renameValue} maxlength="60" aria-label="Nuevo nombre"
                        class="flex-1 min-w-0 rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 min-h-[44px]" />
                      <button on:click={() => commitRename(i)} class="px-4 rounded-xl bg-cyan-500 text-sm font-bold text-slate-950 min-h-[44px]">OK</button>
                    </div>
                  {/if}
                </div>
              {:else if !slot && !query.trim()}
                <div class="rounded-2xl border border-dashed border-slate-600/80 px-4 py-4 bg-transparent">
                  <p class="text-xs font-bold text-slate-400 mb-2">SLOT {i + 1} · Vacío</p>
                  <input bind:value={newSlotName[i]} maxlength="60" placeholder={`Nombre para la historia ${i + 1}…`} aria-label={`Nombre para el slot ${i + 1}`}
                    class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 mb-2 min-h-[44px]" />
                  <button on:click={() => createInSlot(i)} class="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-cyan-500/30 border border-slate-600 text-xs font-bold text-slate-200 transition min-h-[44px]">
                    ✨ Empezar historia aquí
                  </button>
                </div>
              {/if}
            {/each}
          </div>
          <p class="text-[11px] text-slate-500 mt-4">Todo se guarda en este dispositivo · {occupiedSlots()} de {MAX_SLOTS} slots ocupados</p>
        {/if}

        {#if view === 'nueva'}
          <h1 class="text-2xl sm:text-3xl font-bold text-white mb-4">Nuevo Proyecto</h1>
          <div class="max-w-xl rounded-2xl bg-[#161c33]/95 border border-emerald-400/30 shadow-xl p-4 sm:p-5">
            <p class="text-xs text-slate-400 mb-3">Ponle nombre y elige con qué empezar.</p>
            <input bind:value={newName} maxlength="60" placeholder="Ponle nombre a tu historia…" aria-label="Nombre de la historia nueva"
              class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400 mb-2 min-h-[44px]" />
            <div class="flex items-center gap-2 mb-3">
              <label for="newPreset" class="text-xs text-slate-400 shrink-0">Empezar con:</label>
              <select id="newPreset" bind:value={newPreset} class="flex-1 min-w-0 rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2.5 text-sm text-white outline-none min-h-[44px]">
                <option value="blank">✨ En blanco</option>
                <option value="sora">Ruta de Sora</option>
                <option value="aoi">Encuentro con Aoi</option>
              </select>
            </div>
            <div class="flex gap-2">
              <button on:click={createNew} class="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-bold text-slate-950 transition min-h-[44px]">
                Crear historia
              </button>
              <button on:click={() => (view = 'proyectos')} class="px-4 py-3 rounded-xl bg-transparent border border-slate-600 text-sm font-bold text-slate-300 transition min-h-[44px]">
                ← Volver
              </button>
            </div>
          </div>
        {/if}

        {#if view === 'plantillas'}
          <h1 class="text-2xl sm:text-3xl font-bold text-white mb-4">Plantillas</h1>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
            {#each PRESETS as p}
              <button on:click={() => createFromPreset(p.id)}
                class="rounded-2xl overflow-hidden bg-[#1a2138] border border-slate-700/60 text-left transition hover:border-cyan-400/50 hover:scale-[1.01] min-h-[44px]">
                <span class="flex items-center justify-center h-28 bg-gradient-to-br from-indigo-500/30 via-[#1b2342] to-[#0f1428] text-5xl">{p.icon}</span>
                <span class="block px-4 py-3">
                  <span class="block text-base font-bold text-white">{p.title}</span>
                  <span class="block text-xs text-slate-400">{p.desc}</span>
                </span>
              </button>
            {/each}
          </div>
        {/if}
      </main>
    </div>
  </div>
</div>
