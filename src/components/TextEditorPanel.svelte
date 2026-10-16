<!-- Panel flotante Editor de texto: edita el diálogo del nodo seleccionado
     (texto + transición + tamaño/rotación/escala/posición). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getStudioState } from '../lib/studio';
  import { getSelectedNode } from '../lib/studio/context';
  import { pushHistory } from '../lib/studio/domain/history';
  import { renderNodes } from '../lib/studio/ui/render-nodes';
  import type { TextTransition, VNNode } from '../lib/types';

  let visible = false;
  let nodeId: string | null = null;
  let text = '';
  let transition: TextTransition = 'none';
  let size = 16;
  let rotation = 0;
  let scale = 1;
  let posY = 0;
  let dirtyText = false;
  // Snapshot tomado al empezar cada gesto de edición (el historial guarda
  // el ANTES; deshacer restaura). Se libera al confirmar o cambiar de nodo.
  let stagedHistory = false;

  function stageHistory() {
    if (!stagedHistory) {
      stagedHistory = true;
      pushHistory();
    }
  }
  let dismissedFor: string | null = null;
  let obs: MutationObserver | null = null;
  let debounce: ReturnType<typeof setTimeout> | null = null;
  let userSelected = false;

  // Cálculos de porcentaje para el relleno degradado de los sliders
  $: sizePct = ((size - 10) / (48 - 10)) * 100;
  $: rotPct = ((rotation - -15) / (15 - -15)) * 100;
  $: scalePct = ((scale - 0.5) / (2 - 0.5)) * 100;
  $: posPct = ((posY - -60) / (60 - -60)) * 100;

  function current(): VNNode | null {
    const n = getSelectedNode();
    return n && typeof n.dialogue === 'string' ? n : null;
  }

  function sync(fromSelection: boolean) {
    const n = current();
    if (!n || dismissedFor === n.id || !userSelected) {
      if (dirtyText && n) commitText(n);
      stagedHistory = false;
      visible = false;
      nodeId = null;
      return;
    }
    if (fromSelection && dirtyText && nodeId && nodeId !== n.id) {
      const st = getStudioState();
      const prev = st?.nodes.find((x) => x.id === nodeId);
      if (prev) commitText(prev);
    }
    visible = true;
    const active = document.activeElement as HTMLElement | null;
    const typing = !!active?.dataset?.teField;
    if (nodeId !== n.id || !typing) {
      text = n.dialogue ?? '';
      transition = n.textTransition ?? 'none';
      size = n.dialogueSize ?? 16;
      rotation = n.rotation ?? 0;
      scale = n.textScale ?? 1;
      posY = n.textPosY ?? 0;
      dirtyText = false;
    }
    nodeId = n.id;
  }

  function commitText(n: VNNode) {
    if (!dirtyText && !stagedHistory) return;
    dirtyText = false;
    stagedHistory = false;
    renderNodes();
  }

  function onText() {
    const n = current();
    if (!n) return;
    stageHistory();
    n.dialogue = text;
    dirtyText = true;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => renderNodes(), 350);
  }

  function live(fn: (n: VNNode) => void) {
    const n = current();
    if (!n) return;
    stageHistory();
    fn(n);
    renderNodes();
  }

  function discrete(fn: (n: VNNode) => void) {
    const n = current();
    if (!n) return;
    stageHistory();
    fn(n);
    stagedHistory = false;
    renderNodes();
    sync(false);
  }

  function close() {
    const n = current();
    if (n) commitText(n);
    dismissedFor = nodeId;
    visible = false;
  }

  onMount(() => {
    sync(false);
    // Solo un TOQUE (sin arrastrar) sobre un nodo muestra el panel.
    // Antes cualquier pointerdown lo abría, así que arrastrar un nodo en
    // móvil abría el editor solo. Los toques en botones/puertos/controles
    // (✏️, ▶, 🗑, sliders, selects) tampoco lo abren.
    let downX = 0;
    let downY = 0;
    let downT = 0;
    let downNode: string | null = null;
    const isControl = (t: HTMLElement | null) =>
      !!t?.closest('aside') ||
      !!t?.closest('button') ||
      !!t?.closest('select') ||
      !!t?.closest('input') ||
      !!t?.closest('textarea') ||
      !!t?.closest('a') ||
      !!t?.closest('[data-action]') ||
      !!t?.closest('.vn-port');
    const markDown = (e: PointerEvent) => {
      downNode = null;
      const t = e.target as HTMLElement | null;
      if (isControl(t)) return;
      const nodeEl = t?.closest('.vn-node');
      if (!nodeEl) return;
      downX = e.clientX;
      downY = e.clientY;
      downT = performance.now();
      downNode = (nodeEl as HTMLElement).dataset.nodeId ?? null;
    };
    const markUp = (e: PointerEvent) => {
      if (!downNode) return;
      const id = downNode;
      downNode = null;
      // Fue arrastre (mover el nodo) o pulsación larga: no abrir el editor.
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 10) return;
      if (performance.now() - downT > 600) return;
      const t = e.target as HTMLElement | null;
      if (isControl(t)) return;
      const nodeEl = t?.closest('.vn-node');
      if (!nodeEl || (nodeEl as HTMLElement).dataset.nodeId !== id) return;
      userSelected = true;
      dismissedFor = null;
      // Diferido: la selección (interactions.ts) se actualiza tras este evento.
      requestAnimationFrame(() => sync(true));
    };
    document.addEventListener('pointerdown', markDown, { capture: true });
    document.addEventListener('pointerup', markUp, { capture: true });
    const layer = document.getElementById('nodesLayer');
    if (layer) {
      obs = new MutationObserver(() => sync(false));
      obs.observe(layer, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
    return () => {
      obs?.disconnect();
      document.removeEventListener('pointerdown', markDown, { capture: true } as AddEventListenerOptions);
      document.removeEventListener('pointerup', markUp, { capture: true } as AddEventListenerOptions);
    };
  });
</script>

{#if visible}
  <aside class="te-panel fixed right-2 sm:right-3 top-[4.5rem] bottom-20 w-[290px] max-w-[86vw] z-30 rounded-2xl bg-[#191c2e]/90 backdrop-blur-xl border border-indigo-400/20 shadow-[0_12px_40px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden">
    <!-- Cabecera -->
    <div class="flex items-center justify-between px-4 pt-4 pb-2.5">
      <h3 class="flex items-center gap-2 text-[15px] font-medium text-slate-100 tracking-wide">
        <svg class="w-5 h-5 text-[#60a5fa]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 16L8 4l5 12" />
          <path d="M4.5 12h7" />
          <path d="M3 20h10" />
          <path d="M15 16l3-7 3 7" />
          <path d="M16 14h4" />
        </svg>
        Editor de texto
      </h3>
      <button onclick={close} title="Cerrar panel" class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center w-7 h-7 text-xs">✕</button>
    </div>

    <!-- Contenido -->
    <div class="px-4 pb-5 pt-1 overflow-y-auto space-y-4 text-sm">
      <!-- Campo de Texto con efecto Neón / Glow -->
      <div>
        <label class="block text-[13px] font-medium text-[#8e96b8] mb-1.5" for="te-text">Texto</label>
        <textarea
          id="te-text"
          data-te-field="1"
          rows="3"
          bind:value={text}
          oninput={onText}
          class="w-full px-3.5 py-2.5 rounded-xl bg-[#101223] border border-[#6b8afd]/75 text-slate-100 text-[14px] leading-snug resize-y shadow-[0_0_14px_rgba(96,130,255,0.22)] focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_18px_rgba(34,211,238,0.35)] transition-all"
        ></textarea>
      </div>

      <!-- Selector de Transición -->
      <div>
        <label class="block text-[13px] font-medium text-[#8e96b8] mb-1.5" for="te-trans">Transición</label>
        <div class="relative">
          <select
            id="te-trans"
            bind:value={transition}
            onchange={() => discrete((n) => { n.textTransition = transition; })}
            class="w-full appearance-none px-3.5 py-2 rounded-xl bg-[#26293e] border border-slate-600/50 text-slate-100 text-[14px] focus:outline-none focus:border-indigo-400 transition cursor-pointer pr-9"
          >
            <option value="none">Ninguna</option>
            <option value="fade">Fundido (Fade In)</option>
            <option value="slide">Deslizar</option>
          </select>
          <svg class="w-4 h-4 text-[#8e96b8] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.25 7.5L10 12.25L14.75 7.5H5.25Z" />
          </svg>
        </div>
      </div>

      <!-- Sliders -->
      <div class="space-y-3.5 pt-1">
        <div>
          <div class="flex items-center justify-between text-[13px] mb-2">
            <span class="text-[#8e96b8] font-medium">Tamaño</span>
            <span class="text-[#8e96b8] tabular-nums">{size}px</span>
          </div>
          <input
            type="range" min="10" max="48" step="1"
            bind:value={size}
            style="--pct: {sizePct}%"
            oninput={() => live((n) => { n.dialogueSize = size; })}
            onchange={() => { stagedHistory = false; }}
            class="te-slider"
            aria-label="Tamaño de texto"
          />
        </div>

        <div>
          <div class="flex items-center justify-between text-[13px] mb-2">
            <span class="text-[#8e96b8] font-medium">Rotación</span>
            <span class="text-[#8e96b8] tabular-nums">{rotation}°</span>
          </div>
          <input
            type="range" min="-15" max="15" step="1"
            bind:value={rotation}
            style="--pct: {rotPct}%"
            oninput={() => live((n) => { n.rotation = rotation; })}
            onchange={() => { stagedHistory = false; }}
            class="te-slider"
            aria-label="Rotación de texto"
          />
        </div>

        <div>
          <div class="flex items-center justify-between text-[13px] mb-2">
            <span class="text-[#8e96b8] font-medium">Escala</span>
            <span class="text-[#8e96b8] tabular-nums">{Number(scale).toFixed(1)}x</span>
          </div>
          <input
            type="range" min="0.5" max="2" step="0.1"
            bind:value={scale}
            style="--pct: {scalePct}%"
            oninput={() => live((n) => { n.textScale = Number(scale); })}
            onchange={() => { stagedHistory = false; }}
            class="te-slider"
            aria-label="Escala de texto"
          />
        </div>

        <div>
          <div class="flex items-center justify-between text-[13px] mb-2">
            <span class="text-[#8e96b8] font-medium">Posición</span>
            <span class="text-[#8e96b8] tabular-nums">{posY}px</span>
          </div>
          <input
            type="range" min="-60" max="60" step="2"
            bind:value={posY}
            style="--pct: {posPct}%"
            oninput={() => live((n) => { n.textPosY = posY; })}
            onchange={() => { stagedHistory = false; }}
            class="te-slider"
            aria-label="Posición vertical de texto"
          />
        </div>
      </div>
    </div>
  </aside>
{/if}

<style>
  .te-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 9999px;
    background: linear-gradient(
      to right,
      #8b5cf6 0%,
      #22d3ee var(--pct, 50%),
      #323650 var(--pct, 50%),
      #323650 100%
    );
    outline: none;
    cursor: pointer;
  }

  .te-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 8px rgba(34, 211, 238, 0.5), 0 2px 4px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }

  .te-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 0 12px rgba(34, 211, 238, 0.8), 0 2px 5px rgba(0, 0, 0, 0.5);
  }

  .te-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border: none;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 8px rgba(34, 211, 238, 0.5), 0 2px 4px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }

  .te-slider::-moz-range-thumb:hover {
    transform: scale(1.1);
  }

  /* ---- Solo móvil: el editor pasa a ser hoja inferior a ancho completo.
     En PC se mantiene el panel lateral (right/top/bottom intactos). ---- */
  @media (max-width: 640px) {
    .te-panel {
      left: 0.5rem;
      right: 0.5rem;
      top: auto;
      bottom: calc(4.5rem + env(safe-area-inset-bottom));
      width: auto;
      max-width: none;
      max-height: 52dvh;
      border-radius: 1.1rem;
    }
    .te-panel .te-slider {
      height: 8px;
    }
    .te-panel .te-slider::-webkit-slider-thumb {
      width: 24px;
      height: 24px;
    }
    .te-panel .te-slider::-moz-range-thumb {
      width: 24px;
      height: 24px;
    }
  }
</style>