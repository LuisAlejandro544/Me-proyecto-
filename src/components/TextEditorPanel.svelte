<!-- Panel flotante Editor de texto: edita el diálogo del nodo seleccionado
     (texto + transición + tamaño/rotación/escala/posición). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getStudioState } from '../lib/studio';
  import { ctx } from '../lib/studio/context';
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
  let dismissedFor: string | null = null;
  let obs: MutationObserver | null = null;
  let debounce: ReturnType<typeof setTimeout> | null = null;
  let userSelected = false;

  function current(): VNNode | null {
    const sel = ctx.selectedNodeId;
    if (!sel) return null;
    const n = ctx.state.nodes.find((x) => x.id === sel) ?? null;
    return n && typeof n.dialogue === 'string' ? n : null;
  }

  function sync(fromSelection: boolean) {
    const n = current();
    if (!n || dismissedFor === n.id || !userSelected) {
      if (dirtyText && n) commitText(n);
      visible = false;
      nodeId = null;
      return;
    }
    if (fromSelection && dirtyText && nodeId && nodeId !== n.id) {
      const prev = ctx.state.nodes.find((x) => x.id === nodeId);
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
    if (!dirtyText) return;
    dirtyText = false;
    pushHistory();
    renderNodes();
  }

  function onText() {
    const n = current();
    if (!n) return;
    n.dialogue = text;
    dirtyText = true;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => renderNodes(), 350);
  }

  function live(fn: (n: VNNode) => void) {
    const n = current();
    if (!n) return;
    fn(n);
    renderNodes();
  }

  function discrete(fn: (n: VNNode) => void) {
    const n = current();
    if (!n) return;
    fn(n);
    pushHistory();
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
    const mark = () => {
      userSelected = true;
      dismissedFor = null;
      sync(false);
    };
    document.addEventListener('pointerdown', mark, { capture: true });
    const layer = document.getElementById('nodesLayer');
    if (layer) {
      obs = new MutationObserver(() => sync(false));
      obs.observe(layer, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
    return () => {
      obs?.disconnect();
      document.removeEventListener('pointerdown', mark, { capture: true } as AddEventListenerOptions);
    };
  });
</script>

{#if visible}
  <aside class="fixed right-2 sm:right-3 top-[4.5rem] bottom-20 w-[300px] max-w-[86vw] z-30 rounded-2xl bg-[#161c33]/92 backdrop-blur-md border border-slate-700/70 shadow-2xl flex flex-col overflow-hidden">
    <div class="flex items-center justify-between px-4 pt-3.5 pb-2">
      <h3 class="flex items-center gap-2 text-[15px] font-semibold text-slate-100">
        <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z" />
          <path stroke-linecap="round" d="M4 6h9M7 3v3" />
        </svg>
        Editor de texto
      </h3>
      <button onclick={close} title="Cerrar panel" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition min-w-[32px] min-h-[32px]">✕</button>
    </div>

    <div class="px-4 pb-4 overflow-y-auto space-y-4 text-sm">
      <div>
        <label class="block text-[13px] text-slate-300 mb-1.5" for="te-text">Texto</label>
        <textarea
          id="te-text" data-te-field="1" rows="3" bind:value={text} oninput={onText}
          class="w-full px-3 py-2 rounded-xl bg-[#0e1330] border border-indigo-400/50 text-slate-100 text-sm leading-relaxed resize-y focus:outline-none focus:border-cyan-400"
        ></textarea>
      </div>

      <div>
        <label class="block text-[13px] text-slate-300 mb-1.5" for="te-trans">Transición</label>
        <select
          id="te-trans" bind:value={transition}
          onchange={() => discrete((n) => { n.textTransition = transition; })}
          class="w-full px-3 py-2 rounded-xl bg-[#232b4d] border border-slate-600/70 text-slate-100 text-sm focus:outline-none focus:border-cyan-400"
        >
          <option value="none">Ninguna</option>
          <option value="fade">Fundido</option>
          <option value="slide">Deslizar</option>
        </select>
      </div>

      <div>
        <div class='flex items-center justify-between text-[13px] text-slate-300'><span>Tamaño</span><span class='text-slate-400 tabular-nums'>{size}px</span></div>
        <input type="range" min="10" max="48" step="1" bind:value={size} oninput={() => live((n) => { n.dialogueSize = size; })} onchange={() => pushHistory()} class='w-full accent-cyan-400 cursor-pointer' aria-label="Tamaño de texto" />
      </div>
      <div>
        <div class='flex items-center justify-between text-[13px] text-slate-300'><span>Rotación</span><span class='text-slate-400 tabular-nums'>{rotation}°</span></div>
        <input type="range" min="-15" max="15" step="1" bind:value={rotation} oninput={() => live((n) => { n.rotation = rotation; })} onchange={() => pushHistory()} class='w-full accent-cyan-400 cursor-pointer' aria-label="Rotación de texto" />
      </div>
      <div>
        <div class='flex items-center justify-between text-[13px] text-slate-300'><span>Escala</span><span class='text-slate-400 tabular-nums'>{Number(scale).toFixed(1)}x</span></div>
        <input type="range" min="0.5" max="2" step="0.1" bind:value={scale} oninput={() => live((n) => { n.textScale = Number(scale); })} onchange={() => pushHistory()} class='w-full accent-cyan-400 cursor-pointer' aria-label="Escala de texto" />
      </div>
      <div>
        <div class='flex items-center justify-between text-[13px] text-slate-300'><span>Posición</span><span class='text-slate-400 tabular-nums'>{posY}px</span></div>
        <input type="range" min="-60" max="60" step="2" bind:value={posY} oninput={() => live((n) => { n.textPosY = posY; })} onchange={() => pushHistory()} class='w-full accent-cyan-400 cursor-pointer' aria-label="Posición vertical de texto" />
      </div>
    </div>
  </aside>
{/if}
