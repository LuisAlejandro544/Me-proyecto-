  <!-- MAIN WORKSPACE AREA -->
  <main id="canvasViewport" class="relative flex-1 w-full overflow-hidden vn-canvas-bg cursor-grab active:cursor-grabbing">

    <!-- Quick Mode Switcher Pill (Top-Left floating helper to compare View 1 & View 2 effortlessly) -->
    <div class="absolute top-2 left-2 right-2 sm:right-auto z-30 flex items-center gap-1.5 bg-[#161c33]/90 backdrop-blur-md border border-slate-700/70 rounded-full p-1 shadow-lg overflow-x-auto max-w-[calc(100vw-1rem)]" style="scrollbar-width: none;">
      <button id="pillPresetSora" class="px-3 py-2 rounded-full text-xs font-semibold transition bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shrink-0 min-h-[36px]">
        Escena 1: Sora (móvil)
      </button>
      <button id="pillPresetAoi" class="px-3 py-2 rounded-full text-xs font-semibold transition text-slate-400 hover:text-white shrink-0 min-h-[36px]">
        Escena 2: Aoi (tableta)
      </button>
      <span class="hidden md:inline-block text-[11px] text-slate-400 px-2 border-l border-slate-700/70 whitespace-nowrap">
        Arrastra nodos o puertos • Doble clic en un texto para editar
      </span>
      <span class="md:hidden text-[11px] text-slate-400 px-2 border-l border-slate-700/70 whitespace-nowrap truncate max-w-[36vw]">
        Toca ✏️ para editar • Arrastra puertos para conectar
      </span>
    </div>

    <!-- Pan Layer (translate only) > Zoom Layer (CSS zoom: crisp re-layout, no bitmap scaling) -->
    <div id="panLayer" class="absolute inset-0">
    <div id="canvasWorld" class="absolute top-0 left-0 origin-top-left" style="zoom: 1;">
      <!-- SVG Layer for Glowing Bezier Wires -->
      <svg id="wiresSvg" class="absolute inset-0 w-[4000px] h-[3000px] pointer-events-none overflow-visible" style="z-index: 5;">
        <defs>
          <filter id="glow-cyan" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur1" />
            <feGaussianBlur stdDeviation="10" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-coral" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur1" />
            <feGaussianBlur stdDeviation="10" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g id="wiresLayer" class="pointer-events-auto"></g>
        <path id="tempDragWire" class="hidden" fill="none" stroke="#00f2fe" stroke-width="3.5" stroke-dasharray="6 4" filter="url(#glow-cyan)" />
      </svg>

      <!-- Nodes Container -->
      <div id="nodesLayer" class="relative w-full h-full"></div>
    </div>
    </div>

    <!-- Floating Bottom-Left Zoom / Pan Pill (from Image 1) -->
    <div class="absolute bottom-4 left-4 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#171c32]/90 backdrop-blur-md border border-slate-700/70 shadow-xl">
      <button id="btnZoomOutPill" title="Reducir zoom" class="text-slate-300 hover:text-cyan-300 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"/></svg>
      </button>
      <span id="pillZoomLabel" class="text-xs sm:text-sm font-semibold text-slate-100 min-w-[38px] text-center">92%</span>
      <button id="btnCenterCanvas" title="Recentrar el grafo" class="text-slate-400 hover:text-white transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
      </button>
      <button id="btnFitGraph" title="Ajustar todos los nodos a la vista" class="text-slate-400 hover:text-white transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
      </button>
    </div>

    <!-- Floating Bottom-Right Controls: Glowing "+" FAB (Image 1) + Interactive Mini-map (Image 2) -->
    <div class="absolute bottom-4 right-4 z-30 flex items-end gap-3">
      <!-- Glowing Add Node FAB from Image 1 -->
      <button id="btnFabAddNode" title="Añadir nodo nuevo" class="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 p-[1.5px] shadow-[0_0_25px_rgba(0,242,254,0.4)] hover:scale-105 active:scale-95 transition">
        <div class="w-full h-full rounded-[14px] bg-[#1e294b]/80 backdrop-blur-sm flex items-center justify-center text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14"/></svg>
        </div>
      </button>

      <!-- Mini-map & Zoom Widget from Image 2 -->
      <div class="hidden sm:flex flex-col w-36 rounded-xl bg-[#161c32]/95 backdrop-blur-md border border-slate-700/80 shadow-2xl overflow-hidden">
        <div class="relative h-20 w-full bg-[#0d1122] p-1.5 border-b border-slate-700/60">
          <svg id="minimapSvg" viewBox="0 0 1000 600" class="w-full h-full overflow-visible"></svg>
        </div>
        <div class="flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-slate-300">
          <button id="btnMinimapZoomOut" class="hover:text-white px-1 font-bold">−</button>
          <span id="minimapZoomLabel">92%</span>
          <button id="btnMinimapZoomIn" class="hover:text-white px-1 font-bold">+</button>
        </div>
      </div>
    </div>

  </main>
