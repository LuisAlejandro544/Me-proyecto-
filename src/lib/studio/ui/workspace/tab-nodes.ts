// @ts-nocheck
// Workspace: pestaña nodos (extraído de ui/workspace.ts — barrel en ui/workspace.ts).
import { wsUi } from './state';
import { animateTabSwitch } from './tab-switch';
import { addNewNodeOfType } from './tab-nodes-factory';

export function renderNodesTab(modal: HTMLElement, titleEl: HTMLElement, bodyEl: HTMLElement, reopen: (t: string) => void, tabName: string) {
    titleEl.textContent = 'Añadir nodo nuevo al grafo';
    bodyEl.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button data-new-node="banner_scene" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-cyan-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-cyan-300 mb-1">🎬 Nodo de escena con pancarta</div>
          <div class="text-xs text-slate-400">Ilustración de escena 16:9 con puertos de hablante y diálogo.</div>
        </button>
        <button data-new-node="choice" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-rose-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-rose-300 mb-1">🔀 Nodo de decisión / elección</div>
          <div class="text-xs text-slate-400">Decisiones del jugador con ramificaciones color coral y cian.</div>
        </button>
        <button data-new-node="branch_scene" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-indigo-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-indigo-300 mb-1">💬 Nodo de diálogo con avatar</div>
          <div class="text-xs text-slate-400">Tarjeta compacta con miniatura para respuestas con ramificaciones.</div>
        </button>
        <button data-new-node="character_selector" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-emerald-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-emerald-300 mb-1">🎭 Nodo selector de personaje</div>
          <div class="text-xs text-slate-400">Carrusel de avatares, lista de expresiones y deslizadores de tamaño y posición.</div>
        </button>
        <button data-new-node="video_scene" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-fuchsia-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-fuchsia-300 mb-1">🎬 Bloque de vídeo</div>
          <div class="text-xs text-slate-400">Reproduce un vídeo de la carpeta (galería o archivos) y sigue la historia.</div>
        </button>
        <button data-new-node="sound_cue" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-amber-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-amber-300 mb-1">🔊 Nodo complemento de sonido</div>
          <div class="text-xs text-slate-400">Dispara un audio/efecto al entrar (música, ambiente o SFX) sin bloquear.</div>
        </button>
      </div>
    `;
    modal.classList.remove('hidden');

    bodyEl.querySelectorAll('[data-new-node]').forEach(btn => {
      btn.onclick = () => {
        addNewNodeOfType(btn.dataset.newNode);
        modal.classList.add('hidden');
      };
    });
    animateTabSwitch(tabName);
  
}
