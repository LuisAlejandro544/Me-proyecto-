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
</script>

<!-- Menú principal: continuar + 3 slots en almacenamiento local -->
<div id="mainMenu" class="fixed inset-0 z-[60] overflow-y-auto bg-[#0d1124] vn-canvas-bg">
  <div class="min-h-full flex flex-col items-center px-4 py-8 sm:py-12">
    <div class="text-4xl mb-2">📖</div>
    <h1 class="text-2xl sm:text-3xl font-bold text-white text-center">Mis Historias</h1>
    <p class="text-xs sm:text-sm text-slate-400 mt-1 mb-6 text-center max-w-md">
      Todo se guarda en el almacenamiento local de tu dispositivo · Elige dónde seguir editando
    </p>

    {#if error}
      <p class="mb-4 text-xs text-amber-200 bg-amber-400/10 border border-amber-400/40 rounded-xl px-4 py-2.5">{error}</p>
    {/if}

    <!-- Opción 1: continuar donde la dejé -->
    <section aria-label="Continuar historia" class="w-full max-w-xl rounded-2xl bg-[#161c33]/95 border border-cyan-400/30 shadow-xl p-4 sm:p-5 mb-4">
      <h2 class="text-sm font-bold text-cyan-300 mb-1">▶ Continuar donde la dejé</h2>
      {#if autosave}
        <p class="text-sm font-semibold text-white truncate">«{autosave.name}»</p>
        <p class="text-[11px] text-slate-400 mb-3">
          {autosave.state.nodes.length} nodo(s) · última edición {formatDate(autosave.updatedAt)}
        </p>
        <button on:click={continueEditing} class="w-full px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-sm font-bold text-slate-950 transition min-h-[44px]">
          Seguir editando
        </button>
      {:else}
        <p class="text-xs text-slate-400 mb-3">Aún no hay ninguna sesión en este dispositivo. Crea tu primera historia:</p>
        <input bind:value={newName} maxlength="60" placeholder="Ponle nombre a tu historia…" aria-label="Nombre de la historia nueva"
          class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400 mb-2 min-h-[44px]" />
        <div class="flex items-center gap-2 mb-3">
          <label for="newPreset" class="text-[11px] text-slate-400 shrink-0">Empezar con:</label>
          <select id="newPreset" bind:value={newPreset} class="flex-1 rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2.5 text-sm text-white outline-none min-h-[44px]">
            <option value="blank">✨ En blanco</option>
            <option value="sora">Ruta de Sora</option>
            <option value="aoi">Encuentro con Aoi</option>
          </select>
        </div>
        <button on:click={createNew} class="w-full px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-sm font-bold text-slate-950 transition min-h-[44px]">
          Crear historia
        </button>
      {/if}
    </section>

    <!-- Opción 2: 3 slots guardados -->
    <section aria-label="Historias guardadas" class="w-full max-w-xl rounded-2xl bg-[#161c33]/95 border border-slate-700/70 shadow-xl p-4 sm:p-5">
      <h2 class="text-sm font-bold text-white mb-1">💾 Historias guardadas</h2>
      <p class="text-[11px] text-slate-400 mb-3">{MAX_SLOTS} slots en este dispositivo · toca Editar para seguir editando</p>
      <div class="space-y-3">
        {#each slots as slot, i}
          <div class="rounded-xl border border-slate-700 bg-[#101528] p-3.5">
            {#if slot}
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-bold shrink-0">SLOT {i + 1}</span>
                {#if activeSlot === i}
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold shrink-0">● ACTIVO</span>
                {/if}
              </div>
              <input bind:value={slot.name} maxlength="60" aria-label={`Nombre del slot ${i + 1}`}
                class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-400 mb-1 min-h-[44px]" />
              <p class="text-[11px] text-slate-400 mb-2.5">{slotMeta(slot)}</p>
              <div class="flex gap-2">
                <button on:click={() => editSlot(i)} class="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white transition min-h-[44px]">
                  ✏️ Editar
                </button>
                <button on:click={() => deleteSlot(i)} aria-label={`Borrar slot ${i + 1}`} class="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 hover:text-white text-xs font-bold text-rose-300 transition min-h-[44px]">
                  🗑
                </button>
              </div>
            {:else}
              <div class="flex items-center gap-2 mb-2">
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600 font-bold">SLOT {i + 1}</span>
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
      {#if autosave}
        <div class="mt-4 pt-3 border-t border-slate-700/60">
          <p class="text-[11px] text-slate-400 mb-2">¿Otra idea? Dale nombre y empieza de cero (luego guárdala en un slot desde el editor):</p>
          <div class="flex flex-col sm:flex-row gap-2">
            <input bind:value={newName} maxlength="60" placeholder="Nombre de la historia nueva…" aria-label="Nombre de otra historia nueva"
              class="flex-1 rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400 min-h-[44px]" />
            <button on:click={createNew} class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition min-h-[44px]">
              ＋ Nueva
            </button>
          </div>
        </div>
      {/if}
    </section>
  </div>
</div>
