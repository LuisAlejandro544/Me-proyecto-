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

  const cards: {
    id: Target;
    name: string;
    sub: string;
    state: string;
    ready: boolean;
    boxClass: string;
  }[] = [
    {
      id: 'windows',
      name: 'Windows',
      sub: 'Desktop (.exe)',
      state: 'Listo para compilar',
      ready: true,
      boxClass: 'bg-[#152e52]/80 border-[#38bdf8]/50 text-[#38bdf8] shadow-[inset_0_0_12px_rgba(56,189,248,0.25)]',
    },
    {
      id: 'android',
      name: 'Android',
      sub: 'Mobile (.apk)',
      state: 'Se compila en Actions',
      ready: true,
      boxClass: 'bg-[#14352a]/80 border-[#4ade80]/50 text-[#4ade80] shadow-[inset_0_0_12px_rgba(74,222,128,0.25)]',
    },
    {
      id: 'linux',
      name: 'Linux OS',
      sub: '(.universal / x86_64)',
      state: 'Listo para compilar',
      ready: true,
      boxClass: 'bg-[#362823]/80 border-[#fb923c]/50 text-[#fb923c] shadow-[inset_0_0_12px_rgba(251,146,60,0.22)]',
    },
    {
      id: 'video',
      name: 'Video',
      sub: 'Render (.mp4)',
      state: 'No disponible',
      ready: false,
      boxClass: 'bg-[#2a1d42]/80 border-[#c084fc]/50 text-[#c084fc] shadow-[inset_0_0_12px_rgba(192,132,252,0.25)]',
    },
    {
      id: 'macos',
      name: 'macOS',
      sub: 'Desktop (.dmg)',
      state: 'No disponible',
      ready: false,
      boxClass: 'bg-[#282c3e]/80 border-[#94a3b8]/45 text-[#cbd5e1] shadow-[inset_0_0_12px_rgba(148,163,184,0.2)]',
    },
    {
      id: 'web',
      name: 'Web',
      sub: 'App (HTML5 / .zip)',
      state: 'Listo para compilar',
      ready: true,
      boxClass: 'bg-[#152e4d]/80 border-[#38bdf8]/50 text-[#38bdf8] shadow-[inset_0_0_12px_rgba(56,189,248,0.25)]',
    },
  ];

  function destFile(): string {
    const st = getStudioState();
    const stem = sanitizeFileStem(st?.projectName ?? 'MiNovela');
    if (target === 'windows') return `/${stem}/Builds/ (${stem}_Web.html + .bat)`;
    if (target === 'linux') return `/${stem}/Builds/ (${stem}_Web.html + .sh)`;
    if (target === 'web') return `/${stem}/Builds/${stem}_Web.html`;
    if (target === 'android') return `/${stem}/Builds/app-debug.apk`;
    return `/${stem}/Builds/`;
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
    class="fixed inset-0 bg-black/65 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
    role="dialog" aria-modal="true" aria-labelledby="exportModalTitle"
  >
    <div class="w-full max-w-[650px] rounded-[22px] bg-[#191d30]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
      <!-- Cabecera -->
      <div class="flex items-start justify-between px-7 pt-6 pb-2">
        <div>
          <h2 id="exportModalTitle" class="text-[22px] font-bold text-white tracking-tight">Exportar proyecto</h2>
          <p class="text-[14px] text-[#8e96b8] mt-0.5">Elige la plataforma y el formato de destino.</p>
        </div>
        <button
          onclick={close} title="Cerrar" aria-label="Cerrar diálogo de exportación"
          class="p-1.5 rounded-lg text-[#8e96b8] hover:text-white hover:bg-white/10 transition flex items-center justify-center w-8 h-8"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Cuadrícula de 6 tarjetas -->
      <div class="px-7 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {#each cards as c}
          <button
            data-export-target={c.id}
            onclick={() => pick(c.id, c.ready)}
            aria-pressed={target === c.id}
            class="export-card relative text-left rounded-2xl p-3.5 transition-none min-h-[124px] flex flex-col
              {target === c.id ? 'is-selected' : 'is-idle hover:border-slate-500/70'}
              {c.ready ? 'cursor-pointer' : 'opacity-75 cursor-not-allowed'}"
          >
            <!-- Radio superior derecho -->
            <span
              class="absolute top-3 right-3 w-[18px] h-[18px] rounded-full border-[1.8px] flex items-center justify-center transition-none
                {target === c.id
                  ? 'border-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.7)]'
                  : 'border-[#565f82]'}"
              aria-hidden="true"
            >
              {#if target === c.id}
                <span class="w-2 h-2 rounded-full bg-[#38bdf8]"></span>
              {/if}
            </span>

            <!-- Icono + Textos -->
            <div class="flex items-center gap-3 pr-5 mt-0.5">
              <div class="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 {c.boxClass}">
                {#if c.id === 'windows'}
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 5.5l7.5-1v7H3v-6zm8.5-1.1L21 3v8.5h-9.5V4.4zM3 12.5h7.5v7L3 18.5v-6zm8.5 0H21V21l-9.5-1.4v-7.1z"/>
                  </svg>
                {:else if c.id === 'android'}
                  <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.61 15.15c-.46 0-.84-.37-.84-.84s.38-.84.84-.84.84.37.84.84-.38.84-.84.84m-9.22 0c-.46 0-.84-.37-.84-.84s.38-.84.84-.84.84.37.84.84-.38.84-.84.84m9.52-5.04l1.68-2.91a.35.35 0 00-.13-.48.35.35 0 00-.48.13l-1.7 2.95C14.96 9.21 13.53 8.87 12 8.87s-2.96.34-4.28.93L6.02 6.85a.35.35 0 00-.48-.13.35.35 0 00-.13.48l1.68 2.91C4.29 11.63 2.38 14.48 2 17.85h20c-.38-3.37-2.29-6.22-5.09-7.74z"/>
                  </svg>
                {:else if c.id === 'linux'}
                  <svg class="w-8 h-8" viewBox="0 0 48 48" role="img" aria-label="Linux Tux">
                    <!-- aletas -->
                    <ellipse cx="10.5" cy="28" rx="3.2" ry="8" fill="#101320" transform="rotate(18 10.5 28)" />
                    <ellipse cx="37.5" cy="28" rx="3.2" ry="8" fill="#101320" transform="rotate(-18 37.5 28)" />
                    <!-- patas -->
                    <ellipse cx="17" cy="42.5" rx="5" ry="2.6" fill="#ff9d2e" />
                    <ellipse cx="31" cy="42.5" rx="5" ry="2.6" fill="#ff9d2e" />
                    <!-- cuerpo -->
                    <ellipse cx="24" cy="26" rx="13" ry="17" fill="#101320" stroke="rgba(255,255,255,0.28)" stroke-width="1" />
                    <!-- panza -->
                    <ellipse cx="24" cy="31" rx="8" ry="11.5" fill="#f4f6fb" />
                    <!-- cara -->
                    <ellipse cx="24" cy="13.5" rx="7" ry="6" fill="#f4f6fb" />
                    <!-- ojos -->
                    <circle cx="21.3" cy="12.8" r="1.4" fill="#101320" />
                    <circle cx="26.7" cy="12.8" r="1.4" fill="#101320" />
                    <!-- pico -->
                    <polygon points="24,14.8 21,17.8 27,17.8" fill="#ff9d2e" />
                  </svg>
                {:else if c.id === 'video'}
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2.5" />
                    <path d="M7 4v16M17 4v16M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4" />
                    <polygon points="10.5 9.5 14.5 12 10.5 14.5 10.5 9.5" fill="currentColor" />
                  </svg>
                {:else if c.id === 'macos'}
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                {:else if c.id === 'web'}
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3.6 9h16.8M3.6 15h16.8" />
                    <path d="M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
                  </svg>
                {/if}
              </div>

              <div class="min-w-0">
                <span class="block text-[16px] font-bold text-white leading-tight truncate">{c.name}</span>
                <span class="block text-[11.5px] text-[#949ec2] mt-0.5 truncate">{c.sub}</span>
              </div>
            </div>

            <!-- Línea divisoria e indicador de estado -->
            <div
              class="mt-auto pt-2.5 border-t border-white/10 text-[12px] font-medium tracking-wide
                {target === c.id
                  ? 'text-[#38bdf8]'
                  : c.ready
                    ? 'text-[#8e96b8]'
                    : 'text-[#646d8c]'}"
            >
              {c.state}
            </div>
          </button>
        {/each}
      </div>

      <!-- Barra inferior: Destino + Botones -->
      <div class="px-7 pb-6 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="min-w-0 flex-1">
          <p class="text-[13.5px] text-[#cbd5e1] truncate" title={destFile()}>
            Destino: <span class="text-white font-normal">{destFile()}</span>
            <span class="text-[#6366f1] font-medium ml-1">[Descargas]</span>
          </p>
          {#if status}
            <p id="exportStatus" class="text-xs text-[#38bdf8] mt-0.5 truncate">{status}</p>
          {/if}
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <button
            onclick={close}
            class="px-6 py-2 rounded-full border border-[#4a5270] bg-[#1e2338]/70 text-[14px] font-medium text-[#cbd5e1] hover:text-white hover:border-slate-400 hover:bg-[#282e48] transition min-h-[40px]"
          >
            Cancelar
          </button>
          <button
            data-action="export-build"
            onclick={run}
            disabled={busy}
            class="px-6 py-2 rounded-full bg-gradient-to-r from-[#22d3ee] via-[#818cf8] to-[#e879f9] text-[14px] font-semibold text-white shadow-[0_0_24px_rgba(56,189,248,0.45),0_0_24px_rgba(232,121,249,0.35)] hover:brightness-110 transition min-h-[40px] disabled:opacity-60"
          >
            {busy ? 'Compilando… ⏳' : 'Exportar y compilar'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .export-card.is-idle {
    background: rgba(34, 39, 62, 0.72);
    border: 1.5px solid rgba(255, 255, 255, 0.08);
  }

  .export-card.is-selected {
    background:
      linear-gradient(155deg, rgba(28, 45, 78, 0.92) 0%, rgba(28, 32, 54, 0.95) 100%) padding-box,
      linear-gradient(135deg, #38bdf8 0%, #818cf8 55%, #c084fc 100%) border-box;
    border: 1.8px solid transparent;
    box-shadow:
      0 0 22px rgba(56, 189, 248, 0.22),
      inset 0 0 18px rgba(56, 189, 248, 0.08);
  }
</style>