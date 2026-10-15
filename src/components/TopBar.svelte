<!-- TOP HEADER BAR (Combines controls from both reference screenshots) -->
  <header class="min-h-14 px-2 sm:px-5 py-1.5 bg-[#121629]/95 border-b border-slate-700/50 flex items-center justify-between gap-1.5 sm:gap-2 z-40 shrink-0 shadow-lg">
    <!-- Left: Back button + Project Selector -->
    <div class="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
      <button id="btnResetView" title="Centrar la vista del lienzo" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition shrink-0 min-w-[40px] min-h-[40px]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
      </button>

      <div class="relative min-w-0">
        <button id="btnProjectDropdown" class="flex items-center gap-1 text-sm sm:text-base font-medium text-slate-300 hover:text-white px-1.5 sm:px-2.5 py-2 rounded-lg hover:bg-slate-800/60 transition min-w-0 min-h-[44px]">
          <span class="hidden md:inline text-slate-400 font-normal shrink-0">Proyecto:</span>
          <span id="currentProjectLabel" class="font-bold text-white truncate max-w-[28vw] sm:max-w-[220px]">Mi Novela</span>
          <svg class="w-4 h-4 text-slate-400 ml-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div id="projectDropdownMenu" class="hidden absolute left-0 mt-2 w-72 rounded-xl bg-[#181e36] border border-slate-600/60 shadow-2xl py-2 z-50">
          <div class="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cambiar preset de escena</div>
          <button data-preset="sora" class="preset-option w-full text-left px-3.5 py-2.5 text-xs sm:text-sm hover:bg-indigo-500/20 flex items-center justify-between text-white">
            <div>
              <div class="font-semibold text-cyan-300">Mi Novela — Ruta de Sora</div>
              <div class="text-[11px] text-slate-400">Escena inicial 1 + Bosque + Selector de personaje</div>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">Vista 1</span>
          </button>
          <button data-preset="aoi" class="preset-option w-full text-left px-3.5 py-2.5 text-xs sm:text-sm hover:bg-indigo-500/20 flex items-center justify-between text-white">
            <div>
              <div class="font-semibold text-rose-300">Mi Novela — Encuentro con Aoi</div>
              <div class="text-[11px] text-slate-400">Bifurcación de decisión + Ramas de disculpa / broma</div>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30">Vista 2</span>
          </button>
          <div class="border-t border-slate-700/60 my-1"></div>
          <button data-preset="blank" class="preset-option w-full text-left px-3.5 py-2 text-xs sm:text-sm hover:bg-slate-700/50 text-slate-300 flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
            Nuevo grafo de historia en blanco
          </button>
        </div>
      </div>
    </div>

    <!-- Center: Preview / Play + Undo/Redo + Zoom % -->
    <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
      <button id="btnShareLevel" title="Compartir nivel por enlace para jugar" class="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#1a2340] hover:bg-[#243059] border border-emerald-400/50 text-xs font-medium text-emerald-200 transition min-h-[40px]">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        <span class="hidden sm:inline">Compartir</span>
      </button>
      <button id="btnPlayPreviewTop" class="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full bg-gradient-to-r from-[#232b4a] to-[#2c3558] hover:from-[#2d3860] hover:to-[#37426d] border border-cyan-400/40 shadow-[0_0_15px_rgba(0,242,254,0.18)] text-xs sm:text-sm font-medium text-white transition min-h-[40px]">
        <svg class="w-3.5 h-3.5 text-cyan-400 fill-current shrink-0" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        <span class="hidden min-[420px]:inline">Vista previa</span>
        <span class="min-[420px]:hidden">Jugar</span>
        <span class="hidden md:inline text-slate-400 font-normal">(Jugar)</span>
      </button>

      <div class="hidden sm:flex items-center bg-[#181e36] border border-slate-700/70 rounded-lg px-1.5 py-1 gap-1">
        <button id="btnUndo" title="Deshacer (Ctrl+Z)" class="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/50 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4"/></svg>
        </button>
        <button id="btnRedo" title="Rehacer (Ctrl+Y)" class="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/50 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4"/></svg>
        </button>
        <div class="h-3.5 w-[1px] bg-slate-700 mx-0.5"></div>
        <button id="btnZoomResetTop" class="px-2 py-0.5 text-xs text-slate-300 hover:text-white font-medium">
          <span id="topZoomLabel">92%</span>
        </button>
      </div>
    </div>

    <!-- Right: Export Win (.exe) & Web (.html) + Settings -->
    <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <span class="hidden lg:inline text-xs text-slate-400 mr-0.5">Exportar:</span>

      <button id="btnExportExe" class="hidden min-[560px]:flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#15233b] hover:bg-[#1c3050] border border-cyan-400/60 shadow-[0_0_12px_rgba(0,242,254,0.2)] text-xs font-medium text-cyan-200 transition min-h-[40px]">
        <svg class="w-3.5 h-3.5 text-cyan-400 fill-current" viewBox="0 0 24 24">
          <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
        </svg>
        <span>Win (.exe)</span>
      </button>

      <button id="btnExportHtml" class="hidden min-[560px]:flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#2a1c27] hover:bg-[#3b2536] border border-rose-400/60 shadow-[0_0_12px_rgba(255,117,107,0.2)] text-xs font-medium text-rose-200 transition min-h-[40px]">
        <svg class="w-3.5 h-3.5 text-orange-400 fill-current" viewBox="0 0 24 24">
          <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/>
        </svg>
        <span>Web (.html)</span>
      </button>

      <button id="btnTopSettings" title="Ajustes globales" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition min-w-[40px] min-h-[40px]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </button>
    </div>
  </header>
