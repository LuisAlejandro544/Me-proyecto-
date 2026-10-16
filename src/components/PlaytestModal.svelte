  <!-- MODAL DEL MOTOR DE PRUEBA DE NOVELA VISUAL (formato horizontal 16:9, como se juega de verdad) -->
  <div id="playtestModal" class="hidden fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4">
    <div id="vnPlaytestCard" class="vn-playtest-landscape relative w-full sm:max-w-[960px] h-[100dvh] sm:h-[86vh] sm:max-h-[640px] bg-[#0c1021] sm:rounded-[1.4rem] overflow-hidden flex flex-col justify-between border-0 sm:border-2 border-cyan-400/50 sm:shadow-[0_0_50px_rgba(0,242,254,0.22)]">
      <!-- Dynamic Scene Background -->
      <div id="vnStageBg" class="absolute inset-0 bg-cover bg-center transition-all duration-500" style="background: radial-gradient(circle at 50% 35%, #283666 0%, #0d1226 100%);">
        <div class="absolute inset-0 bg-gradient-to-t from-[#080b18] via-transparent to-black/40"></div>
      </div>

      <!-- Top HUD inside Player -->
      <div class="relative z-20 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            PRUEBA EN VIVO
          </span>
          <span id="vnCurrentNodeBadge" class="text-xs text-slate-300 font-medium truncate max-w-[140px]">Escena inicial 1</span>
        </div>
        <div class="flex items-center gap-2">
          <button id="btnVnRestart" class="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 border border-slate-600/50 transition">
            Reiniciar historia
          </button>
          <button id="btnVnToggleAudio" class="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-cyan-300 border border-slate-600/50 transition">
            🔊 Sonido activado
          </button>
          <button id="btnVnFullscreen" class="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 border border-slate-600/50 transition">⛶ Pantalla completa</button>
          <button id="btnClosePlaytest" class="px-3 py-1 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-xs font-semibold text-white transition">
            Salir de la vista previa
          </button>
        </div>
      </div>

      <!-- Center Character Sprite & Branching Choices Layer -->
      <div class="vn-playtest-stage relative z-10 flex-1 flex items-center justify-center pointer-events-none px-4 min-h-0">
        <div id="vnSpriteContainer" class="transition-all duration-300 flex flex-col items-center max-h-full">
          <img id="vnCharacterSprite" class="hidden max-h-[38vh] sm:max-h-[34vh] w-auto max-w-full object-contain rounded-2xl border border-white/15 shadow-2xl" alt="Personaje" />
        </div>

        <!-- Choice Overlay Buttons when on a Choice Node or Scene with Choices -->
        <video id="vnVideoPlayer" class="hidden w-full max-w-[560px] max-h-[40vh] rounded-2xl border border-fuchsia-400/40 bg-black shadow-2xl pointer-events-auto" controls playsinline preload="metadata"></video>
        <audio id="vnAudioPlayer" class="hidden" preload="auto"></audio>
        <div id="vnRotateHint" class="hidden absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 border border-amber-400/50 text-[11px] text-amber-200 pointer-events-auto">🔄 Gira el móvil para jugar en horizontal</div>
        <div id="vnChoicesOverlay" class="hidden absolute inset-0 bg-black/45 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 p-6 pointer-events-auto overflow-y-auto"></div>
      </div>

      <!-- Bottom Visual Novel Dialogue Box -->
      <div class="relative z-20 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div id="vnDialogueBox" class="bg-[#12172d]/95 border border-cyan-400/40 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
          <div class="flex items-center justify-between mb-1.5">
            <span id="vnSpeakerName" class="text-sm sm:text-base font-bold text-rose-400 tracking-wide">Narrador</span>
            <span id="vnExpressionTag" class="text-[11px] text-slate-400">Sin personaje • Escala 100%</span>
          </div>
          <p id="vnDialogueText" class="text-sm sm:text-base text-slate-100 leading-relaxed min-h-[2.75rem]">
            …
          </p>
          <div class="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
            <div id="vnVariablesReadout" class="text-[11px] text-slate-400 flex items-center gap-3"></div>
            <button id="btnVnNext" class="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-xs sm:text-sm font-semibold text-slate-950 shadow-lg transition">
              <span>Continuar</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
