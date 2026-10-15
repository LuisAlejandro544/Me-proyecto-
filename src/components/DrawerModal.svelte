  <!-- MODAL AÑADIR NODO / PANEL -->
  <div id="drawerModal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full sm:max-w-2xl bg-[#161c33] border border-slate-700/80 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col mb-[env(safe-area-inset-bottom)] sm:mb-0">
      <div class="px-5 py-3.5 bg-[#111629] border-b border-slate-700/60 flex items-center justify-between">
        <h3 id="drawerModalTitle" class="text-base font-bold text-white flex items-center gap-2">Panel de trabajo</h3>
        <button id="btnCloseDrawer" title="Cerrar panel" aria-label="Cerrar panel" class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div id="drawerModalBody" class="p-5 overflow-y-auto space-y-4 text-sm text-slate-200"></div>
    </div>
  </div>
