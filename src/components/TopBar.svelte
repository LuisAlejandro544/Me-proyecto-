<!-- TOP HEADER BAR (Combines controls from both reference screenshots) -->
  <header class="min-h-14 px-2 sm:px-5 py-1.5 bg-[#121629]/95 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 z-40 shrink-0 shadow-lg">
    <!-- Left: Home + Back button + Project Selector -->
    <div class="flex items-center gap-1 sm:gap-3 min-w-0 flex-1 order-1">
      <button id="btnGoHome" title="Volver al menú principal" aria-label="Volver al menú principal" class="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 transition shrink-0 min-w-[44px] min-h-[44px]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"/>
        </svg>
      </button>
      <button id="btnResetView" title="Centrar la vista del lienzo" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition shrink-0 min-w-[44px] min-h-[44px]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
      </button>

      <div class="relative min-w-0">
        <button id="btnProjectDropdown" class="flex items-center gap-1 text-sm sm:text-base font-medium text-slate-300 hover:text-white px-1.5 sm:px-2.5 py-2 rounded-lg hover:bg-slate-800/60 transition min-w-0 min-h-[44px]">
          <span class="hidden md:inline text-slate-400 font-normal shrink-0">Proyecto:</span>
          <span id="currentProjectLabel" class="font-bold text-white truncate max-w-[38vw] sm:max-w-[220px]">Mi Novela</span>
          <svg class="w-4 h-4 text-slate-400 ml-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div id="projectDropdownMenu" class="hidden absolute left-0 mt-2 w-72 max-w-[calc(100vw-1rem)] rounded-xl bg-[#181e36] border border-slate-600/60 shadow-2xl py-2 z-50">
          <div class="px-3.5 pt-1 pb-2">
            <label for="projectNameInput" class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Nombre de la historia</label>
            <input id="projectNameInput" maxlength="60" spellcheck="false" placeholder="Ponle nombre a tu historia…"
              class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400 min-h-[44px]" />
          </div>
          <div class="px-3.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Guardar en este dispositivo</div>
          <div class="px-3.5 pb-2 grid grid-cols-3 gap-1.5">
            <button data-slot-save="0" class="slot-save-btn px-2 py-2.5 rounded-xl bg-slate-800 hover:bg-cyan-500/30 border border-slate-600 text-xs font-bold text-slate-200 transition min-h-[44px]">Slot 1</button>
            <button data-slot-save="1" class="slot-save-btn px-2 py-2.5 rounded-xl bg-slate-800 hover:bg-cyan-500/30 border border-slate-600 text-xs font-bold text-slate-200 transition min-h-[44px]">Slot 2</button>
            <button data-slot-save="2" class="slot-save-btn px-2 py-2.5 rounded-xl bg-slate-800 hover:bg-cyan-500/30 border border-slate-600 text-xs font-bold text-slate-200 transition min-h-[44px]">Slot 3</button>
          </div>
          <div class="px-3.5 pb-2 text-[11px] text-slate-500">Se guarda en el almacenamiento local · autosave al editar.</div>
          <div class="border-t border-slate-700/60 my-1"></div>
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
    <!-- En móvil baja a una segunda fila con scroll horizontal: nunca tapa el título ni el botón Compartir -->
    <div class="topbar-actions flex items-center gap-1.5 sm:gap-3 shrink-0 order-3 basis-full justify-start overflow-x-auto py-1 sm:order-2 sm:basis-auto sm:py-0">
      <button id="btnShareLevel" title="Compartir nivel por enlace para jugar" class="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#1a2340] hover:bg-[#243059] border border-emerald-400/50 text-xs font-medium text-emerald-200 transition min-h-[44px] shrink-0">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        <span class="hidden min-[420px]:inline">Compartir</span>
      </button>
      <button id="btnPlayPreviewTop" class="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full bg-gradient-to-r from-[#232b4a] to-[#2c3558] hover:from-[#2d3860] hover:to-[#37426d] border border-cyan-400/40 shadow-[0_0_15px_rgba(0,242,254,0.18)] text-xs sm:text-sm font-medium text-white transition min-h-[44px] shrink-0">
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
    <div class="flex items-center gap-2 sm:gap-2.5 shrink-0 order-2 sm:order-3">
      <span class="hidden lg:inline text-xs text-slate-400 mr-0.5">Exportar:</span>

      <button id="btnExportExe" class="hidden min-[560px]:flex items-center gap-1.5 h-[30px] px-3.5 rounded-full bg-[#161c32]/60 hover:bg-[#38bdf8]/15 border-2 border-[#3894b8] text-xs font-medium text-[#56bdda] transition">
        <svg class="w-3.5 h-3.5 text-[#51bad6] fill-current" viewBox="0 0 24 24">
          <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
        </svg>
        <span>Win (.exe)</span>
      </button>

      <button id="btnExportLinux" class="hidden min-[560px]:flex items-center gap-1.5 h-[30px] px-3.5 rounded-full bg-[#161c32]/60 hover:bg-[#4ade80]/15 border-2 border-[#41987c] text-xs font-medium text-[#7cc8a4] transition">
        <svg class="w-3.5 h-3.5 text-[#7cc8a4] fill-current" viewBox="0 0 24 24">
          <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 00-.402-.533 1.45 1.45 0 00-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 00.314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 01.647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 01-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z"/>
        </svg>
        <span>Linux (.sh)</span>
      </button>

      <button id="btnExportHtml" class="hidden min-[560px]:flex items-center gap-1.5 h-[30px] px-3.5 rounded-full bg-[#161c32]/60 hover:bg-[#fb7185]/15 border-2 border-[#a45969] text-xs font-medium text-[#d68595] transition">
        <svg class="w-3.5 h-3.5 text-[#da8785] fill-current" viewBox="0 0 24 24">
          <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/>
        </svg>
        <span>Web (.html)</span>
      </button>

      <button id="btnCheckUpdates" title="Buscar actualizaciones" aria-label="Buscar actualizaciones" class="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition min-w-[40px] min-h-[44px]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        <span id="updateDot" class="hidden absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#121629]"></span>
      </button>
      <button id="btnTopSettings" title="Ajustes globales" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition min-w-[40px] min-h-[44px]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </button>
    </div>
  </header>
