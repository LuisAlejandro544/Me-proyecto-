  <!-- PANTALLA DE CARGA DEL NIVEL COMPARTIDO -->
  <div id="shareLoading" class="hidden fixed inset-0 z-[90] bg-[#0b0f1f] flex-col items-center justify-center gap-5 p-8 text-center">
    <div class="share-loader-spin" aria-hidden="true"></div>
    <div>
      <div class="text-lg font-bold text-white">Cargando tu nivel…</div>
      <div id="shareLoadingMsg" class="text-sm text-slate-400 mt-1">Conectando con la historia</div>
    </div>
    <div class="w-full max-w-xs h-2 rounded-full bg-slate-800 overflow-hidden">
      <div id="shareLoadingBar" class="h-full w-[5%] rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500"></div>
    </div>
    <div id="shareLoadingGame" class="text-xs text-slate-500">Preparando escenario a pantalla completa</div>
  </div>
