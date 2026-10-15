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

  function refresh() {
    slots = loadSlots();
    autosave = loadAutosave();
    activeSlot = getActiveSlot();
  }

  onMount(() => {
    refresh();
    openSection = autosave ? 'continue' : 'new';
  });

  function cleanName(v: string, fallback: string): string {
    const t = (v || '').trim().slice(0, 60);
    return t || fallback;
  }

  function blankState(name: string): VNState {
    return {
      projectName: name,
      zoom: 0.92,
      panX: 40,
      panY: 40,
      variables: { chapter: 1 },
      nodes: [
        {
          id: 'start_1',
          type: 'banner_scene',
          badge: 'Escena inicial 1',
          x: 120,
          y: 120,
          width: 245,
          characterId: 'sora',
          speaker: 'Sora',
          speakerColor: '#ff758c',
          dialogue: '¡Bienvenido a tu nueva novela visual!\nAñade nodos abajo.',
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
    refresh();
  }

  function slotMeta(s: SaveSlot): string {
    const n = s.state.nodes.length;
    const w = s.state.wires.length;
    return `${n} nodo(s) · ${w} conexión(es) · ${formatDate(s.updatedAt)}`;
  }

  // Menú principal colapsable: solo una sección abierta a la vez.
  type MenuSection = 'continue' | 'slots' | 'new';
  let openSection: MenuSection = 'slots';

  function toggle(section: MenuSection) {
    openSection = openSection === section ? openSection : section;
  }

  function occupiedSlots(): number {
    return slots.filter((s) => !!s).length;
  }
</script>

<!-- Menú principal: botones que abren secciones (solo una abierta a la vez) -->
<div id="mainMenu" class="fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-[#0d1124] vn-canvas-bg">
  <div class="min-h-full flex flex-col items-center w-full max-w-xl mx-auto px-4 py-8 sm:py-12 box-border">
    <div class="text-4xl mb-2">📖</div>
    <h1 class="text-2xl sm:text-3xl font-bold text-white text-center">Mis Historias</h1>
    <p class="text-xs sm:text-sm text-slate-400 mt-1 mb-6 text-center max-w-md">
      Todo se guarda en el almacenamiento local de tu dispositivo · Elige una opción
    </p>

    {#if error}
      <p class="mb-4 w-full text-xs text-amber-200 bg-amber-400/10 border border-amber-400/40 rounded-xl px-4 py-2.5">{error}</p>
    {/if}

    <!-- Botonera principal -->
    <nav aria-label="Menú principal" class="w-full grid gap-2.5 mb-4">
      <button
        on:click={() => toggle('continue')}
        aria-expanded={openSection === 'continue'}
        class={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition min-h-[56px] ${openSection === 'continue' ? 'bg-cyan-500/15 border-cyan-400/50' : 'bg-[#161c33]/95 border-slate-700/70'}`}
      >
        <span class="text-xl shrink-0">▶</span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-bold text-white truncate">Continuar donde la dejé</span>
          <span class="block text-[11px] text-slate-400 truncate">{autosave ? `«${autosave.name}»` : 'Sin sesión todavía'}</span>
        </span>
        <span class="text-slate-400 text-xs shrink-0">{openSection === 'continue' ? '▲' : '▼'}</span>
      </button>
      <button
        on:click={() => toggle('slots')}
        aria-expanded={openSection === 'slots'}
        class={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition min-h-[56px] ${openSection === 'slots' ? 'bg-indigo-500/15 border-indigo-400/50' : 'bg-[#161c33]/95 border-slate-700/70'}`}
      >
        <span class="text-xl shrink-0">💾</span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-bold text-white truncate">Historias guardadas</span>
          <span class="block text-[11px] text-slate-400 truncate">{occupiedSlots()} de {MAX_SLOTS} slots ocupados</span>
        </span>
        <span class="text-slate-400 text-xs shrink-0">{openSection === 'slots' ? '▲' : '▼'}</span>
      </button>
      <button
        on:click={() => toggle('new')}
        aria-expanded={openSection === 'new'}
        class={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition min-h-[56px] ${openSection === 'new' ? 'bg-emerald-500/15 border-emerald-400/50' : 'bg-[#161c33]/95 border-slate-700/70'}`}
      >
        <span class="text-xl shrink-0">✨</span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-bold text-white truncate">Nueva historia</span>
          <span class="block text-[11px] text-slate-400 truncate">En blanco o desde plantilla</span>
        </span>
        <span class="text-slate-400 text-xs shrink-0">{openSection === 'new' ? '▲' : '▼'}</span>
      </button>
    </nav>

    {#if openSection === 'continue'}
    <section aria-label="Continuar historia" class="w-full rounded-2xl bg-[#161c33]/95 border border-cyan-400/30 shadow-xl p-4 sm:p-5">
      <h2 class="text-sm font-bold text-cyan-300 mb-1">▶ Continuar donde la dejé</h2>
      {#if autosave}
        <p class="text-sm font-semibold text-white truncate">«{autosave.name}»</p>
        <p class="text-[11px] text-slate-400 mb-3">
          {autosave.state.nodes.length} nodo(s) · última edición {formatDate(autosave.updatedAt)}
        </p>
        <button on:click={continueEditing} class="w-full px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-sm font-bold text-slate-950 transition min-h-[44px]">
          Seguir editando
        </button>
        <button on:click={() => toggle('slots')} class="w-full mt-2 px-4 py-2.5 rounded-xl bg-transparent border border-slate-600 text-xs font-bold text-slate-300 transition min-h-[44px]">
          Ver historias guardadas →
        </button>
      {:else}
        <p class="text-xs text-slate-400 mb-3">Aún no hay ninguna sesión en este dispositivo.</p>
        <button on:click={() => toggle('new')} class="w-full px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-sm font-bold text-slate-950 transition min-h-[44px]">
          Crear mi primera historia →
        </button>
      {/if}
    </section>
    {/if}

    {#if openSection === 'new'}
    <section aria-label="Nueva historia" class="w-full rounded-2xl bg-[#161c33]/95 border border-emerald-400/30 shadow-xl p-4 sm:p-5">
      <h2 class="text-sm font-bold text-emerald-300 mb-1">✨ Nueva historia</h2>
      <p class="text-[11px] text-slate-400 mb-3">Ponle nombre y elige con qué empezar.</p>
      <input bind:value={newName} maxlength="60" placeholder="Ponle nombre a tu historia…" aria-label="Nombre de la historia nueva"
        class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400 mb-2 min-h-[44px]" />
      <div class="flex items-center gap-2 mb-3">
        <label for="newPreset" class="text-[11px] text-slate-400 shrink-0">Empezar con:</label>
        <select id="newPreset" bind:value={newPreset} class="flex-1 min-w-0 rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2.5 text-sm text-white outline-none min-h-[44px]">
          <option value="blank">✨ En blanco</option>
          <option value="sora">Ruta de Sora</option>
          <option value="aoi">Encuentro con Aoi</option>
        </select>
      </div>
      <button on:click={createNew} class="w-full px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-bold text-slate-950 transition min-h-[44px]">
        Crear historia
      </button>
    </section>
    {/if}

    {#if openSection === 'slots'}
    <section aria-label="Historias guardadas" class="w-full rounded-2xl bg-[#161c33]/95 border border-slate-700/70 shadow-xl p-4 sm:p-5">
      <h2 class="text-sm font-bold text-white mb-1">💾 Historias guardadas</h2>
      <p class="text-[11px] text-slate-400 mb-3">{MAX_SLOTS} slots en este dispositivo · toca Editar para seguir editando</p>
      <div class="space-y-3">
        {#each slots as slot, i}
          <div class="rounded-xl border border-slate-700 bg-[#101528] p-3.5 min-w-0">
            {#if slot}
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-bold shrink-0">SLOT {i + 1}</span>
                {#if activeSlot === i}
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold shrink-0">● ACTIVO</span>
                {/if}
              </div>
              <input bind:value={slot.name} maxlength="60" aria-label={`Nombre del slot ${i + 1}`}
                class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-400 mb-1 min-h-[44px]" />
              <p class="text-[11px] text-slate-400 mb-2.5">{slotMeta(slot)}</p>
              <div class="flex gap-2">
                <button on:click={() => editSlot(i)} class="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white transition min-h-[44px]">
                  ✏️ Editar
                </button>
                <button on:click={() => deleteSlot(i)} aria-label={`Borrar slot ${i + 1}`} class="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 hover:text-white text-xs font-bold text-rose-300 transition min-h-[44px] shrink-0">
                  🗑
                </button>
              </div>
            {:else}
              <div class="flex items-center gap-2 mb-2">
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600 font-bold shrink-0">SLOT {i + 1}</span>
                <span class="text-[11px] text-slate-500">Vacío</span>
              </div>
              <input bind:value={newSlotName[i]} maxlength="60" placeholder={`Nombre para la historia ${i + 1}…`} aria-label={`Nombre para el slot ${i + 1}`}
                class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 mb-2 min-h-[44px]" />
              <button on:click={() => createInSlot(i)} class="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-cyan-500/30 border border-slate-600 text-xs font-bold text-slate-200 transition min-h-[44px]">
                ✨ Empezar historia aquí
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </section>
    {/if}
  </div>
</div>
