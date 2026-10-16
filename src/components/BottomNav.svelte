  <!-- BOTTOM NAVIGATION BAR (Combines Image 1 & Image 2 tabs seamlessly) -->
  <footer class="min-h-16 bg-[#111526]/95 border-t border-slate-800/80 px-2 sm:px-6 pt-1 flex items-stretch gap-1 z-40 shrink-0 overflow-x-auto overscroll-x-contain pb-[max(0.35rem,env(safe-area-inset-bottom))]" style="scrollbar-width: thin;">
    <!-- Tab 1: Nodes / Add Node -->
    <button data-tab="nodes" class="nav-tab-btn group relative flex items-center gap-2 px-3 py-2 rounded-xl text-cyan-300 font-medium text-xs sm:text-sm transition shrink-0">
      <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 nav-indicator"></div>
      <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
      </svg>
      <div class="text-left">
        <div>Nodos</div>
        <div class="hidden md:block text-[10px] text-slate-400 font-normal">+ Añadir nodo</div>
      </div>
    </button>

    <!-- Tab 2: Assets -->
    <button data-tab="assets" class="nav-tab-btn group relative flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white font-medium text-xs sm:text-sm transition shrink-0">
      <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
      </svg>
      <div class="text-left">
        <div>Recursos</div>
        <div class="hidden md:block text-[10px] text-slate-500 font-normal">Sprites y fondos</div>
      </div>
    </button>

    <!-- Tab 3: Compositor -->
    <button data-tab="compositor" class="nav-tab-btn group relative flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white font-medium text-xs sm:text-sm transition shrink-0">
      <svg class="w-5 h-5 text-fuchsia-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <div class="text-left">
        <div>Componer</div>
        <div class="hidden md:block text-[10px] text-slate-500 font-normal">Fondo + sprites</div>
      </div>
    </button>

    <!-- Tab 4: Timeline & Variables -->
    <button data-tab="timeline" class="nav-tab-btn group relative flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white font-medium text-xs sm:text-sm transition shrink-0">
      <svg class="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
      </svg>
      <div class="text-left">
        <div>Cronología</div>
        <div class="hidden md:block text-[10px] text-slate-500 font-normal">Variables</div>
      </div>
    </button>

    <!-- Tab 4: Characters -->
    <button data-tab="characters" class="nav-tab-btn group relative flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white font-medium text-xs sm:text-sm transition shrink-0">
      <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
      <div class="text-left">
        <div>Personajes</div>
        <div class="hidden md:block text-[10px] text-slate-500 font-normal">Reparto y poses</div>
      </div>
    </button>

    <!-- Tab: Diálogos -->
    <button data-tab="dialogues" class="nav-tab-btn group relative flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white font-medium text-xs sm:text-sm transition shrink-0">
      <svg class="w-5 h-5 text-fuchsia-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8m-8 4h5m7-2a9 9 0 01-9 9H6l-3 3v-6a9 9 0 019-9h5a9 9 0 019 3z"/>
      </svg>
      <div class="text-left">
        <div>Diálogos</div>
        <div class="hidden md:block text-[10px] text-slate-500 font-normal">Diseños y letras</div>
      </div>
    </button>

    <!-- Tab 5: Playtest -->
    <button data-tab="playtest" class="nav-tab-btn group relative flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white font-medium text-xs sm:text-sm transition shrink-0">
      <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div class="text-left">
        <div>Probar</div>
        <div class="hidden md:block text-[10px] text-slate-500 font-normal">Jugar</div>
      </div>
    </button>

    <!-- Tab 6: Settings & Audio -->
    <button data-tab="settings" class="nav-tab-btn group relative flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white font-medium text-xs sm:text-sm transition shrink-0">
      <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <div class="text-left">
        <div>Ajustes</div>
        <div class="hidden md:block text-[10px] text-slate-500 font-normal">Audio y prefs.</div>
      </div>
    </button>
  </footer>
