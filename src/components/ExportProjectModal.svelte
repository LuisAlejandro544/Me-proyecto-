<!-- Diálogo Exportar proyecto (estilo Flow): 6 tarjetas de plataforma con radio,
     línea de destino y Exportar y compilar. Se abre con `vn:open-export`. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getStudioState } from '../lib/studio';
  import { sanitizeFileStem, validateStory } from '../lib/studio/ui/compile';
  import {
    exportLinuxPackage,
    exportStandaloneHtmlFile,
    exportWindowsPackage,
  } from '../lib/studio/ui/compile';
  import { showToast } from '../lib/studio/ui/toast';

  type Target = 'windows' | 'android' | 'linux' | 'video' | 'macos' | 'web';

  let open = false;
  let target: Target = 'windows';
  let busy = false;
  let status = '';

  const cards: { id: Target; icon: string; name: string; sub: string; state: string; ready: boolean }[] = [
    { id: 'windows', icon: '🪟', name: 'Windows', sub: 'Escritorio (.exe)', state: 'Listo para compilar', ready: true },
    { id: 'android', icon: '🤖', name: 'Android', sub: 'Móvil (.apk)', state: 'Se compila en Actions', ready: true },
    { id: 'linux', icon: '🐧', name: 'Linux OS', sub: 'Lanzadores (.sh)', state: 'Listo para compilar', ready: true },
    { id: 'video', icon: '🎬', name: 'Vídeo', sub: 'Render (.mp4)', state: 'No disponible', ready: false },
    { id: 'macos', icon: '🍎', name: 'macOS', sub: 'Escritorio (.dmg)', state: 'No disponible', ready: false },
    { id: 'web', icon: '🌐', name: 'Web', sub: 'App (HTML5)', state: 'Listo para compilar', ready: true },
  ];

  function destFile(): string {
    const st = getStudioState();
    const stem = sanitizeFileStem(st?.projectName ?? 'Mi Novela');
    if (target === 'windows') return `${stem}_Web.html + Iniciar_${stem}.bat`;
    if (target === 'linux') return `${stem}_Web.html + jugar-${stem.toLowerCase()}.sh + .desktop`;
    if (target === 'web') return `${stem}_Web.html`;
    if (target === 'android') return 'app-debug.apk (Actions → APK debug)';
    return '—';
  }

  function pick(id: Target, ready: boolean) {
    if (!ready) {
      showToast('Ese formato aún no está disponible en esta app');
      return;
    }
    target = id;
    status = '';
  }

  function close() {
    if (!busy) open = false;
  }

  async function run() {
    if (busy) return;
    const issues = validateStory();
    const err = issues.find((i) => i.level === 'error');
    if (err) {
      showToast(`No se puede compilar: ${err.msg}`);
      return;
    }
    if (target === 'video' || target === 'macos') {
      showToast('Ese formato aún no está disponible en esta app');
      return;
    }
    if (target === 'android') {
      showToast('El .apk se compila en Actions (workflow «APK debug», tag android-debug)');
      return;
    }
    busy = true;
    status = 'Generando…';
    try {
      if (target === 'windows') await exportWindowsPackage((m) => { status = m; });
      else if (target === 'linux') await exportLinuxPackage((m) => { status = m; });
      else {
        status = 'Generando .html…';
        await exportStandaloneHtmlFile();
        status = '¡Listo! Revisa tu carpeta de descargas. ✅';
      }
    } finally {
      busy = false;
    }
  }

  onMount(() => {
    const show = () => {
      target = 'windows';
      status = '';
      busy = false;
      open = true;
    };
    window.addEventListener('vn:open-export', show);
    return () => window.removeEventListener('vn:open-export', show);
  });
</script>

{#if open}
  <div
    id="exportModal"
    class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
    role="dialog" aria-modal="true" aria-labelledby="exportModalTitle"
  >
    <div class="w-full max-w-2xl rounded-2xl bg-[#1a2038]/95 backdrop-blur-md border border-slate-600/60 shadow-2xl overflow-hidden">
      <div class="flex items-start justify-between px-6 pt-5 pb-1">
        <div>
          <h2 id="exportModalTitle" class="text-2xl font-bold text-white">Exportar proyecto</h2>
          <p class="text-sm text-slate-400 mt-1">Elige la plataforma y el formato.</p>
        </div>
        <button
          onclick={close} title="Cerrar" aria-label="Cerrar diálogo de exportación"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition min-w-[32px] min-h-[32px]"
        >✕</button>
      </div>

      <div class="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {#each cards as c}
          <button
            data-export-target={c.id}
            onclick={() => pick(c.id, c.ready)}
            aria-pressed={target === c.id}
            class="relative text-left rounded-xl border-2 p-3.5 pt-3 transition min-h-[118px] flex flex-col
              {target === c.id
                ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_18px_rgba(34,211,238,0.25)]'
                : 'border-slate-600/70 bg-[#232b4d]/80 hover:border-slate-400'}
              {c.ready ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}"
          >
            <span
              class="absolute top-2.5 right-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center
                {target === c.id ? 'border-cyan-300' : 'border-slate-500'}"
              aria-hidden="true"
            >
              {#if target === c.id}<span class="w-2.5 h-2.5 rounded-full bg-cyan-300"></span>{/if}
            </span>
            <span class="flex items-center gap-2.5">
              <span class="text-3xl" aria-hidden="true">{c.icon}</span>
              <span>
                <span class="block text-[15px] font-bold text-white leading-tight">{c.name}</span>
                <span class="block text-xs text-slate-400">{c.sub}</span>
              </span>
            </span>
            <span class="mt-auto pt-2 mt-3 border-t border-slate-600/60 text-xs {c.ready ? 'text-cyan-300/90' : 'text-slate-500'}">
              {c.state}
            </span>
          </button>
        {/each}
      </div>

      <div class="px-6 pb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <p class="flex-1 min-w-0 text-sm text-slate-300 truncate" title={destFile()}>
          Destino: <span class="font-mono text-[13px] text-slate-400">{destFile()}</span>
        </p>
        <p id="exportStatus" class="text-xs text-cyan-300 min-h-[18px] sm:max-w-[220px] truncate">{status}</p>
        <div class="flex gap-2 shrink-0">
          <button
            onclick={close}
            class="px-5 py-2.5 rounded-full border border-slate-500 text-sm font-semibold text-slate-200 hover:bg-slate-700/60 transition min-h-[44px]"
          >Cancelar</button>
          <button
            data-action="export-build" onclick={run} disabled={busy}
            class="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-sm font-bold text-slate-950 shadow-lg transition min-h-[44px] disabled:opacity-60"
          >{busy ? 'Compilando… ⏳' : 'Exportar y compilar'}</button>
        </div>
      </div>
    </div>
  </div>
{/if}
