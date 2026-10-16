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
        <button data-new-node="jump" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-sky-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-sky-300 mb-1">↗️ Nodo de salto</div>
          <div class="text-xs text-slate-400">Salta a otra escena o nodo sin cable largo cruzando el lienzo.</div>
        </button>
        <button data-new-node="ending" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-emerald-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-emerald-300 mb-1">🏁 Nodo de final</div>
          <div class="text-xs text-slate-400">Final contable (bueno/malo/secreto) con título y epílogo.</div>
        </button>
        <button data-new-node="background" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-orange-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-orange-300 mb-1">🖼️ Nodo de fondo</div>
          <div class="text-xs text-slate-400">Cambia el fondo del escenario con transición y sigue.</div>
        </button>
        <button data-new-node="narration" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-slate-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-slate-200 mb-1">📖 Nodo de narración</div>
          <div class="text-xs text-slate-400">Texto a pantalla completa sin hablante ni sprite.</div>
        </button>
        <button data-new-node="monologue" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-violet-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-violet-300 mb-1">💭 Nodo de monólogo</div>
          <div class="text-xs text-slate-400">Pensamiento interno en cursiva con burbuja propia.</div>
        </button>
        <button data-new-node="wait" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-yellow-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-yellow-300 mb-1">⏳ Nodo de pausa</div>
          <div class="text-xs text-slate-400">Espera unos ms (susto, comedia, dramatismo) y sigue solo.</div>
        </button>
        <button data-new-node="effect" class="vn-anim-card p-4 rounded-xl bg-[#1e2646] hover:bg-[#263159] border border-pink-400/30 text-left transition hover:-translate-y-0.5">
          <div class="font-bold text-pink-300 mb-1">✨ Nodo de efecto</div>
          <div class="text-xs text-slate-400">Flash, sacudida o partículas sobre el escenario.</div>
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
