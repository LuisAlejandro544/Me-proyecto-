<!-- Compact scene card (Fase 2 slice 1). Presentational: same classes/attrs
     as the legacy template so attachNodeInteractions() keeps working.
     Svelte auto-escapes interpolations (XSS-safe by default). -->
<script lang="ts">
  import type { VNNode } from '../../lib/types';

  let { node }: { node: VNNode } = $props();
</script>

<div class="p-4 relative vn-node-pad-ports">
  <!-- Input Port -->
  <div
    class="vn-port {node.inColor === 'coral' ? 'vn-port-coral' : 'vn-port-cyan'} vn-port-in"
    style="left: -9px; top: 24px;"
    data-node-id={node.id}
    data-port-id="in_main"
    data-port-dir="in"
    data-port-color={node.inColor || 'cyan'}
  ></div>

  <div class="text-sm font-bold text-white mb-2 editable-field" data-field="title">
    {node.title || 'Escena'}
  </div>
  <div class="text-xs text-slate-200 leading-relaxed whitespace-pre-line editable-field" data-field="dialogue">
    {node.dialogue}
  </div>

  <!-- Output Port -->
  <div
    class="vn-port vn-port-cyan vn-port-out"
    style="right: -9px; top: 50%; transform: translateY(-50%);"
    data-node-id={node.id}
    data-port-id="out_main"
    data-port-dir="out"
    data-port-color="cyan"
  ></div>
</div>
