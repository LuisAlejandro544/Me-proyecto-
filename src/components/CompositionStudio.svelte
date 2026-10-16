<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getCustomAssets,
    pickAssetsFromDevice,
    saveCustomAssetFromDataUrl,
    IMAGE_ACCEPT
  } from '../lib/assets';
  import { CHARACTER_ASSETS } from '../lib/studio/data/assets';
  import {
    createComposition,
    createLayer,
    getCompositions,
    renderCompositionToDataUrl,
    saveCompositions,
    type Composition,
    type CompositionLayer
  } from '../lib/compositions';
  import {
    PHOTO_VIDEO_TAPS_REQUIRED,
    confirmPhotoVideoTouch,
    countTouchTap,
    isTouchMobile,
    resetTouchTaps
  } from '../lib/studio/ui/touch-edit';

  let compositions: Composition[] = [];
  let current: Composition | null = null;
  let selectedLayerId: string | null = null;
  let toast = '';
  let toastTimer: number | null = null;
  let saveName = '';
  let saveTags = '';
  let exporting = false;
  let sourceTarget: 'background' | 'layer' = 'layer';
  let showSourceMenu = false;
  let dragId: string | null = null;

  const imageAssets = () => getCustomAssets().filter((a) => a.kind === 'imagen');
  const sprites = () => Object.values(CHARACTER_ASSETS as Record<string, any>);

  function say(msg: string) {
    toast = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toast = ''), 2200);
  }

  function selectComposition(id: string) {
    current = compositions.find((c) => c.id === id) ?? null;
    selectedLayerId = current?.layers.slice(-1)[0]?.id ?? null;
    if (current) saveName = current.name;
  }

  function newComposition() {
    const c = createComposition(`Escena ${compositions.length + 1}`);
    compositions = [...compositions, c];
    saveCompositions(compositions);
    selectComposition(c.id);
    say('Nueva escena creada 🎨');
  }

  function persist() {
    if (!current) return;
    current.updatedAt = Date.now();
    compositions = compositions.map((c) => (c.id === current!.id ? current! : c));
    saveCompositions(compositions);
  }

  function removeComposition() {
    if (!current) return;
    if (!confirm(`¿Eliminar «${current.name}» del editor?`)) return;
    compositions = compositions.filter((c) => c.id !== current!.id);
    saveCompositions(compositions);
    current = compositions.slice(-1)[0] ?? null;
    if (current) saveName = current.name;
    say('Composición eliminada 🗑');
  }

  function selectedLayer(): CompositionLayer | null {
    return current?.layers.find((l) => l.id === selectedLayerId) ?? null;
  }

  function addLayer(src: string, name: string) {
    if (!current) newComposition();
    if (!current) return;
    const layer = createLayer(src, name);
    // Apila con ligero desplazamiento para ver la nueva capa.
    layer.x = 42 + Math.random() * 16;
    layer.y = 55 + Math.random() * 12;
    current.layers = [...current.layers, layer];
    selectedLayerId = layer.id;
    persist();
    say(`Sprite «${name}» añadido ✨`);
  }

  function setBackground(src: string, name: string) {
    if (!current) newComposition();
    if (!current) return;
    current.background = src;
    current.bgName = name;
    persist();
    say(`Fondo: «${name}» 🖼`);
  }

  // Toque en móvil sobre una foto/vídeo del catálogo: cuenta los toques
  // (1/2) y pide popup de confirmación antes de ponerla como fondo/sprite.
  // En PC se aplica directo como antes.
  function tapCatalogPhoto(src: string, name: string) {
    if (isTouchMobile()) {
      const taps = countTouchTap(`composer:${sourceTarget}:${name}`);
      if (taps < PHOTO_VIDEO_TAPS_REQUIRED) {
        say(`👆 Toque ${taps}/${PHOTO_VIDEO_TAPS_REQUIRED} sobre «${name}» — toca de nuevo para usarla`);
        return;
      }
      resetTouchTaps(`composer:${sourceTarget}:${name}`);
      if (!confirmPhotoVideoTouch(name, taps, 'asignar')) return;
    }
    if (sourceTarget === 'background') setBackground(src, name);
    else addLayer(src, name);
  }

  async function addFromDevice(source: 'gallery' | 'files') {
    say(source === 'gallery' ? 'Abriendo galería…' : 'Abriendo archivos…');
    showSourceMenu = false;
    const res = await pickAssetsFromDevice({
      accept: IMAGE_ACCEPT,
      multiple: true,
      source: source === 'gallery' ? 'gallery' : 'files'
    });
    const fresh = imageAssets().slice(-Math.max(res.agregados, 1));
    if (sourceTarget === 'background') {
      const last = fresh.slice(-1)[0];
      if (last) setBackground(last.dataUrl, last.name);
      else if (!res.agregados) say('No se eligió ningún fondo');
    } else {
      if (fresh.length && res.agregados > 0) {
        for (const a of fresh) addLayer(a.dataUrl, a.name);
      } else say('No se eligió ningún sprite');
    }
  }

  function moveLayer(id: string, dir: 1 | -1) {
    if (!current) return;
    const i = current.layers.findIndex((l) => l.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= current.layers.length) return;
    const copy = [...current.layers];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    current.layers = copy;
    persist();
  }

  function updateSelected(patch: Partial<CompositionLayer>) {
    const layer = selectedLayer();
    if (!current || !layer) return;
    Object.assign(layer, patch);
    current.layers = [...current.layers];
    persist();
  }

  function duplicateSelected() {
    const layer = selectedLayer();
    if (!current || !layer) return;
    const copy: CompositionLayer = {
      ...layer,
      id: `layer_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      x: Math.min(94, layer.x + 5),
      y: Math.min(94, layer.y + 5),
      name: `${layer.name} (copia)`
    };
    current.layers = [...current.layers, copy];
    selectedLayerId = copy.id;
    persist();
    say('Capa duplicada ⧉');
  }

  function deleteSelected() {
    if (!current || !selectedLayerId) return;
    current.layers = current.layers.filter((l) => l.id !== selectedLayerId);
    selectedLayerId = current.layers.slice(-1)[0]?.id ?? null;
    persist();
  }

  function onStagePointerDown(e: PointerEvent, id: string) {
    selectedLayerId = id;
    dragId = id;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onStagePointerMove(e: PointerEvent) {
    if (!dragId || !current) return;
    const stage = document.getElementById('composerStage');
    const layer = current.layers.find((l) => l.id === dragId);
    if (!stage || !layer) return;
    const rect = stage.getBoundingClientRect();
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    layer.x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    layer.y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    current.layers = [...current.layers];
  }

  function onStagePointerUp() {
    if (dragId) persist();
    dragId = null;
  }

  async function exportToAssets() {
    if (!current || exporting) return;
    exporting = true;
    try {
      const dataUrl = await renderCompositionToDataUrl(current);
      const tags = saveTags.split(',').map((t) => t.trim()).filter(Boolean);
      const asset = saveCustomAssetFromDataUrl(dataUrl, saveName || current.name, tags);
      if (asset) say(`Guardada en Recursos como «${asset.name}» 🎉`);
      else say('No se pudo guardar la composición');
    } catch {
      say('No se pudo renderizar la escena');
    } finally {
      exporting = false;
    }
  }

  function close() {
    window.dispatchEvent(new CustomEvent('vn:close-composer'));
  }

  onMount(() => {
    compositions = getCompositions();
    if (compositions.length === 0) {
      const c = createComposition('Escena 1');
      compositions = [c];
      saveCompositions(compositions);
    }
    current = compositions.slice(-1)[0] ?? null;
    if (current) {
      saveName = current.name;
      selectedLayerId = current.layers.slice(-1)[0]?.id ?? null;
    }
    const onAssets = () => (compositions = [...compositions]);
    window.addEventListener('vn:assets-changed', onAssets);
    return () => window.removeEventListener('vn:assets-changed', onAssets);
  });
</script>

<!-- Pantalla completa independiente del editor de composición (no es un popup). -->
<div id="composerScreen" class="fixed inset-0 z-[80] flex flex-col bg-[#0d1124] text-slate-100 w-screen max-w-[100vw] overflow-x-hidden box-border">
  <header class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-5 py-2.5 border-b border-slate-800 bg-[#111526]/95 shrink-0 min-w-0 max-w-full box-border">
    <button
      id="btnComposerBack"
      on:click={close}
      class="px-2 sm:px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold min-h-[44px] shrink-0"
    >
      ← <span class="hidden min-[380px]:inline">Volver</span><span class="min-[380px]:hidden">Atrás</span>
    </button>
    <div class="flex-1 min-w-0">
      <div class="text-[13px] sm:text-sm font-bold truncate">🎨 Editor de escenas <span class="hidden min-[420px]:inline text-slate-400 font-normal">· fondo + sprites</span></div>
      <div class="hidden sm:block text-[11px] text-slate-400 truncate">Arrastra los sprites sobre el lienzo 16:9 y guárdalo en Recursos</div>
    </div>
    <select
      aria-label="Composición activa"
      class="hidden sm:block px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs max-w-52 shrink-0 min-w-0"
      value={current?.id ?? ''}
      on:change={(e) => selectComposition((e.target as HTMLSelectElement).value)}
    >
      {#each compositions as c (c.id)}
        <option value={c.id}>{c.name}</option>
      {/each}
    </select>
    <button
      id="btnComposerNew"
      on:click={newComposition}
      class="px-2 sm:px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white min-h-[44px] shrink-0"
    >
      ＋ <span class="hidden min-[380px]:inline">Nueva</span><span class="min-[380px]:hidden">＋</span>
    </button>
  </header>

  <!-- Selector de escena en móvil (segunda fila, a ancho completo, sin overflow) -->
  <div class="sm:hidden px-2 py-1.5 border-b border-slate-800/70 bg-[#111526]/95 shrink-0 min-w-0 box-border">
    <select
      aria-label="Composición activa"
      class="w-full min-w-0 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs min-h-[44px] truncate"
      value={current?.id ?? ''}
      on:change={(e) => selectComposition((e.target as HTMLSelectElement).value)}
    >
      {#each compositions as c (c.id)}
        <option value={c.id}>{c.name}</option>
      {/each}
    </select>
  </div>

  <div class="flex-1 min-h-0 min-w-0 flex flex-col lg:flex-row overflow-hidden max-w-full">
    <!-- Lienzo 16:9 -->
    <section class="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden box-border p-2 sm:p-5 flex flex-col items-stretch gap-3">
      <div class="w-full max-w-3xl mx-auto min-w-0 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 box-border">
        <input
          aria-label="Nombre de la escena"
          bind:value={saveName}
          maxlength="60"
          placeholder="Nombre de la escena…"
          on:change={() => {
            if (current && saveName.trim()) {
              current.name = saveName.trim();
              persist();
            }
          }}
          class="w-full sm:flex-1 sm:min-w-40 min-w-0 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs outline-none focus:border-cyan-400/70 min-h-[44px] box-border"
        />
        <div class="grid grid-cols-2 sm:flex gap-1.5 w-full sm:w-auto min-w-0">
          <button
            on:click={() => { sourceTarget = 'background'; showSourceMenu = true; }}
            class="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 min-h-[44px] truncate min-w-0"
          >
            🖼 Fondo
          </button>
          <button
            on:click={() => { sourceTarget = 'layer'; showSourceMenu = true; }}
            class="px-3 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-xs font-bold text-white min-h-[44px] truncate min-w-0"
          >
            ✨ Sprite
          </button>
        </div>
      </div>

      {#if showSourceMenu}
        <div class="w-full max-w-3xl mx-auto min-w-0 box-border p-3 rounded-2xl bg-[#161c38] border border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button on:click={() => addFromDevice('gallery')} class="px-3 py-2.5 rounded-xl bg-indigo-500 text-xs font-bold min-h-[44px] min-w-0 truncate">🖼️ Galería</button>
          <button on:click={() => addFromDevice('files')} class="px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-xs font-bold min-h-[44px] min-w-0 truncate">📁 Archivos</button>
          <button on:click={() => showSourceMenu = false} class="col-span-2 sm:col-span-2 px-3 py-2.5 rounded-xl bg-transparent border border-slate-600 text-xs text-slate-300 min-h-[44px]">Cerrar</button>
          <p class="col-span-2 sm:col-span-4 text-[11px] text-slate-400">
            {sourceTarget === 'background' ? 'El fondo' : 'El sprite'} también puede elegirse abajo desde tus Recursos o los sprites incluidos, sin salir de esta pantalla.
          </p>
        </div>
      {/if}

      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        id="composerStage"
        on:pointermove={onStagePointerMove}
        on:pointerup={onStagePointerUp}
        on:pointerleave={onStagePointerUp}
        class="relative w-full max-w-3xl mx-auto min-w-0 aspect-video min-h-[220px] rounded-2xl overflow-hidden border border-slate-700 select-none box-border"
        style:background={current?.background ? undefined : (current?.bgColor ?? '#151b33')}
      >
        {#if current?.background}
          <img
            src={current.background}
            alt="Fondo de la escena"
            draggable="false"
            class="absolute inset-0 w-full h-full"
            style:object-fit={current.bgFit === 'contain' ? 'contain' : current.bgFit === 'stretch' ? 'fill' : 'cover'}
          />
        {/if}
        {#each current?.layers ?? [] as layer (layer.id)}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            on:pointerdown={(e) => onStagePointerDown(e, layer.id)}
            class="absolute"
            style:left={`${layer.x}%`}
            style:top={`${layer.y}%`}
            style:width={`${layer.w}%`}
            style:transform={`translate(-50%, -50%) ${layer.flipH ? 'scaleX(-1)' : ''}`}
            style:opacity={String(layer.opacity)}
            style:z-index={selectedLayerId === layer.id ? 30 : 10}
            style:touch-action="none"
            style:cursor="grab"
          >
            <img
              src={layer.src}
              alt={layer.name}
              draggable="false"
              class="w-full h-auto pointer-events-none"
              style:filter={selectedLayerId === layer.id ? 'drop-shadow(0 0 10px rgba(0,242,254,0.8))' : undefined}
              style:outline={selectedLayerId === layer.id ? '2px dashed rgba(0,242,254,0.9)' : 'none'}
              style:outline-offset="4px"
              style:border-radius="12px"
            />
          </div>
        {/each}
        {#if !(current?.layers?.length) && !current?.background}
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center p-4 overflow-y-auto">
            <div class="text-3xl leading-none">🎨</div>
            <div class="text-sm font-bold">Lienzo vacío</div>
            <p class="text-[11px] leading-snug text-slate-400 max-w-sm">Elige un fondo con «🖼 Fondo» y superpón sprites con «✨ Sprite» desde Recursos, sprites incluidos, galería o archivos.</p>
          </div>
        {/if}
      </div>

      <div class="w-full max-w-3xl mx-auto min-w-0 box-border flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span class="px-2 py-1 rounded-full bg-white/5 border border-white/10 truncate max-w-full">Fondo: {current?.bgName ?? '—'}</span>
        <span class="px-2 py-1 rounded-full bg-white/5 border border-white/10 shrink-0">{current?.layers.length ?? 0} sprite(s)</span>
        {#if selectedLayer()}<span class="px-2 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 truncate max-w-full">Seleccionado: {selectedLayer()?.name}</span>{/if}
      </div>

      <!-- Catálogos rápidos sin salir de la pantalla -->
      <div class="w-full max-w-3xl mx-auto min-w-0 box-border grid gap-3 grid-cols-1 md:grid-cols-2">
        <div class="p-3 rounded-2xl bg-[#141a33] border border-slate-700/80 min-w-0 max-w-full overflow-hidden box-border">
          <div class="text-xs font-bold mb-2 truncate">📁 Tus imágenes (toque = {sourceTarget === 'background' ? 'fondo' : 'sprite'})</div>
          <div class="flex gap-2 overflow-x-auto pb-1 min-w-0 max-w-full" style="scrollbar-width: thin;">
            {#each imageAssets() as a (a.id)}
              <button
                on:click={() => tapCatalogPhoto(a.dataUrl, a.name)}
                class="shrink-0 w-20 text-center group"
                title={a.name}
              >
                <img src={a.dataUrl} alt={a.name} loading="lazy" class="w-20 h-14 object-cover rounded-lg border border-white/15 group-hover:border-cyan-400/70" />
                <div class="text-[10px] truncate text-slate-300 mt-1">{a.name}</div>
              </button>
            {/each}
            {#if !imageAssets().length}
              <p class="text-[11px] text-slate-500">Vacío: usa Galería o Archivos para traer imágenes.</p>
            {/if}
          </div>
        </div>
        <div class="p-3 rounded-2xl bg-[#141a33] border border-slate-700/80 min-w-0 max-w-full overflow-hidden box-border">
          <div class="text-xs font-bold mb-2 truncate">🎭 Sprites incluidos</div>
          <div class="flex gap-2 overflow-x-auto pb-1 min-w-0 max-w-full" style="scrollbar-width: thin;">
            {#each sprites() as s (s.id)}
              <button
                on:click={() => tapCatalogPhoto(s.banner ?? s.avatar, s.name)}
                class="shrink-0 w-20 text-center group"
                title={s.name}
              >
                <img src={s.banner ?? s.avatar} alt={s.name} loading="lazy" class="w-20 h-14 object-cover rounded-lg border border-white/15 group-hover:border-fuchsia-400/70" />
                <div class="text-[10px] truncate text-slate-300 mt-1">{s.name}</div>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </section>

    <!-- Panel lateral de capas + guardado -->
    <aside class="w-full lg:w-80 shrink-0 min-w-0 max-w-full box-border border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#111526]/95 p-3 sm:p-4 overflow-y-auto overflow-x-hidden space-y-3 max-h-[42vh] lg:max-h-none">
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-300">Capas ({current?.layers.length ?? 0})</h2>
        {#if selectedLayer()}
          <div class="flex gap-1.5">
            <button on:click={() => moveLayer(selectedLayerId!, 1)} title="Traer al frente" class="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-xs min-h-[36px]">⬆</button>
            <button on:click={() => moveLayer(selectedLayerId!, -1)} title="Enviar atrás" class="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-xs min-h-[36px]">⬇</button>
            <button on:click={duplicateSelected} title="Duplicar" class="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-xs min-h-[36px]">⧉</button>
            <button on:click={deleteSelected} title="Quitar" class="px-2.5 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs min-h-[36px]">🗑</button>
          </div>
        {/if}
      </div>

      {#if selectedLayer()}
        {@const sel = selectedLayer()!}
        <div class="p-3 rounded-xl bg-[#1a2140] border border-cyan-400/30 space-y-2.5">
          <div class="text-xs font-bold truncate">✨ {sel.name}</div>
          <label class="block text-[11px] text-slate-300">
            Tamaño: {Math.round(sel.w)}%
            <input type="range" min="5" max="95" step="1" value={sel.w} on:input={(e) => updateSelected({ w: Number((e.target as HTMLInputElement).value) })} class="vn-slider w-full" />
          </label>
          <label class="block text-[11px] text-slate-300">
            Opacidad: {Math.round(sel.opacity * 100)}%
            <input type="range" min="0.1" max="1" step="0.05" value={sel.opacity} on:input={(e) => updateSelected({ opacity: Number((e.target as HTMLInputElement).value) })} class="vn-slider w-full" />
          </label>
          <button
            on:click={() => updateSelected({ flipH: !sel.flipH })}
            class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 text-xs font-bold min-h-[44px]"
          >
            {sel.flipH ? '↔ Quitar espejo' : '↔ Espejo horizontal'}
          </button>
        </div>
      {:else}
        <p class="text-[11px] text-slate-500">Toca un sprite del lienzo para ajustar tamaño, opacidad, orden y espejo.</p>
      {/if}

      <div class="space-y-1.5 max-h-44 overflow-y-auto">
        {#each [...(current?.layers ?? [])].reverse() as layer (layer.id)}
          <button
            on:click={() => (selectedLayerId = layer.id)}
            class={`w-full flex items-center gap-2 p-1.5 rounded-xl border text-left ${selectedLayerId === layer.id ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-slate-700 bg-[#161c38]'}`}
          >
            <img src={layer.src} alt={layer.name} class="w-10 h-8 object-cover rounded-lg border border-white/15 shrink-0" />
            <span class="flex-1 min-w-0 text-[11px] font-semibold truncate">{layer.name}</span>
            <span class="text-[10px] text-slate-400 shrink-0">{Math.round(layer.w)}%</span>
          </button>
        {/each}
      </div>

      <div class="p-3 rounded-xl bg-[#1a2140] border border-emerald-400/30 space-y-2 min-w-0 max-w-full box-border">
        <div class="text-xs font-bold text-emerald-200">💾 Guardar en Recursos</div>
        <input
          bind:value={saveTags}
          placeholder="Etiquetas: fondo, noche, bosque…"
          class="w-full min-w-0 box-border px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs outline-none focus:border-emerald-400/70 min-h-[44px]"
        />
        <div class="flex gap-2 min-w-0">
          <button
            id="btnComposerSave"
            on:click={exportToAssets}
            disabled={exporting || !current}
            class="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-xs font-bold text-slate-950 min-h-[44px] truncate"
          >
            {exporting ? 'Guardando…' : 'Guardar PNG'}
          </button>
          <button on:click={removeComposition} class="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-xs min-h-[44px] shrink-0" title="Eliminar composición">🗑</button>
        </div>
        <p class="text-[10px] text-slate-500">Se renderiza a 1280×720 y queda en la carpeta como imagen con esas etiquetas.</p>
      </div>
    </aside>
  </div>

  {#if toast}
    <div class="absolute left-1/2 bottom-6 -translate-x-1/2 px-4 py-2.5 rounded-full bg-slate-900/95 border border-cyan-400/40 text-xs font-semibold shadow-xl z-10">
      {toast}
    </div>
  {/if}
</div>
