<!-- Choice / decision split card (Fase 2 slice 2). Presentational: same
     classes/attrs as the legacy template so attachNodeInteractions() works.
     Svelte auto-escapes interpolations (XSS-safe by default). -->
<script lang="ts">
  import type { ChoiceOption, VNNode } from '../../lib/types';

  let { node }: { node: VNNode } = $props();

  function pillClass(opt: ChoiceOption): string {
    if (opt.style === 'coral')
      return 'bg-gradient-to-r from-[#5a343b] to-[#4a2c33] border-rose-400/50 text-rose-100';
    if (opt.style === 'teal')
      return 'bg-gradient-to-r from-[#1e485c] to-[#1a3b4e] border-cyan-400/50 text-cyan-100';
    return 'bg-[#2a3352]/90 border-slate-500/40 text-slate-100';
  }

  function dotColor(opt: ChoiceOption): string {
    return (opt.inColor || opt.outColor || 'cyan') === 'coral' ? '#ff756b' : '#00f2fe';
  }
</script>

<div class="p-3.5 relative">
  <!-- Entrada única real (toda la decisión se entra por aquí) -->
  <div
    class="vn-port vn-port-cyan vn-port-in"
    style="left: -9px; top: 28px;"
    data-node-id={node.id}
    data-port-id="in_main"
    data-port-dir="in"
    data-port-color="cyan"
  ></div>

  <!-- Header (con hueco a la derecha: botón + y toolbar ✏️/🗑 del nodo) -->
  <div class="flex items-start justify-between gap-2 mb-2.5">
    <div class="min-w-0 flex-1 pr-12">
      <div class="text-xs sm:text-[13px] font-bold text-white">
        <span class="editable-field" data-field="title">{node.title}</span>
        {#if !node.showAddButtons}
          <span class="font-normal text-slate-300 ml-1 editable-field" data-field="subtitle">
            {node.subtitle || ''}
          </span>
        {/if}
      </div>
      {#if node.showAddButtons}
        <div class="text-[11px] text-slate-400 editable-field" data-field="subtitle">{node.subtitle || 'Nodo de elección'}</div>
      {/if}
    </div>
    <button
      data-action="add-choice-opt" data-node={node.id} title="Añadir rama de elección"
      class="w-6 h-6 shrink-0 rounded-full bg-slate-700/80 hover:bg-cyan-500/30 border border-slate-500/60 flex items-center justify-center text-xs font-bold text-slate-200 hover:text-cyan-200 transition"
    >
      +
    </button>
  </div>

  <!-- Options List -->
  <div class="space-y-2.5">
    {#each node.options || [] as opt, idx}
      {@const outRing = opt.outColor === 'coral' ? 'vn-port-ring-coral' : 'vn-port-ring-cyan'}
      <div class="relative flex items-center vn-choice-row">
        <!-- Choice Pill (punto de color decorativo, NO conectable) -->
        <div class="w-full pl-3 pr-3 py-2 rounded-xl border {pillClass(opt)} text-xs font-medium flex items-center gap-2 shadow-inner">
          <span class="vn-choice-dot" style="background: {dotColor(opt)}; box-shadow: 0 0 6px {dotColor(opt)};"></span>
          <span class="editable-option truncate flex-1 min-w-0" data-opt-idx={idx}>{opt.label}</span>
        </div>

        <!-- Salida real: centrada en el borde de la TARJETA -->
        <div
          class="vn-port {outRing} vn-port-out vn-port-choice-out"
          style="top: 50%; transform: translateY(-50%);"
          data-node-id={node.id}
          data-port-id="out_{opt.id}"
          data-port-dir="out"
          data-port-color={opt.outColor || 'cyan'}
        ></div>
      </div>
    {/each}
  </div>

  {#if node.showAddButtons}
    <button
      data-action="add-choice-opt" data-node={node.id}
      class="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#252d47] hover:bg-cyan-500/30 border border-slate-500/70 flex items-center justify-center text-xs text-slate-200 shadow-md"
    >
      +
    </button>
  {/if}
</div>
