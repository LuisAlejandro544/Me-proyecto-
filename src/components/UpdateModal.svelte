<!-- Pantalla "Nueva actualización disponible" (canal auto-update.yml → GitHub Releases) -->
<div
  id="updateModal"
  class="hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] items-center justify-center p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby="updateModalTitle"
>
  <div
    class="w-full max-w-md bg-[#161c33] border border-emerald-400/40 rounded-2xl shadow-2xl overflow-hidden"
  >
    <div class="px-5 py-4 bg-gradient-to-r from-[#0f2b26] to-[#111629] border-b border-emerald-400/20 flex items-start gap-3">
      <div class="text-3xl shrink-0" aria-hidden="true">🎉</div>
      <div class="flex-1 min-w-0">
        <h2 id="updateModalTitle" class="text-base font-bold text-white">
          Nueva actualización disponible
        </h2>
        <p id="updateVersionBadge" class="text-xs font-mono text-emerald-300 mt-0.5">
          0.1.0 → …
        </p>
        <p id="updateMeta" class="text-[11px] text-slate-400 mt-0.5"></p>
      </div>
      <button
        id="btnDismissUpdate"
        title="Cerrar"
        aria-label="Cerrar aviso de actualización"
        class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition min-w-[44px] min-h-[44px]"
      >
        ✕
      </button>
    </div>

    <div class="p-5 space-y-3 text-sm text-slate-200">
      <p id="updateTitleName" class="font-semibold text-white"></p>
      <p
        id="updateNotes"
        class="text-xs text-slate-300 leading-relaxed whitespace-pre-line max-h-32 overflow-y-auto rounded-xl bg-[#0f1428] border border-slate-700/70 p-3"
      ></p>
      <p id="updateZipInfo" class="text-[11px] font-mono text-cyan-200 break-all whitespace-pre-line"></p>
      <p id="updateEnvHint" class="text-[11px] text-slate-400 leading-relaxed"></p>

      <div id="updateProgressWrap" class="hidden space-y-1.5 rounded-xl bg-[#0f1428] border border-slate-700/70 p-3">
        <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div id="updateProgressBar" class="h-full w-0 rounded-full bg-emerald-400 transition-[width] duration-200"></div>
        </div>
        <p class="flex items-center justify-between gap-2 text-[11px] text-slate-300">
          <span id="updateStatus" class="flex-1">Descargando…</span>
          <span id="updateProgressLabel" class="font-mono text-slate-400 shrink-0"></span>
        </p>
        <p id="updateSavedPath" class="text-[10px] font-mono text-slate-500 break-all"></p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <button
          id="btnDownloadUpdate"
          class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition min-h-[44px]"
        >
          📦 Descargar / instalar
        </button>
        <button
          id="btnReloadApp"
          class="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-bold text-cyan-200 transition min-h-[44px]"
        >
          🔄 Recargar app
        </button>
        <button
          id="btnOpenReleaseNotes"
          class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 transition min-h-[44px]"
        >
          📝 Ver release
        </button>
        <button
          id="btnCopyUpdateLink"
          class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 transition min-h-[44px]"
        >
          🔗 Copiar enlace
        </button>
      </div>

      <div class="flex items-center justify-between gap-2 pt-1">
        <button id="btnSkipUpdate" class="text-[11px] text-slate-500 hover:text-slate-300 underline min-h-[44px] px-2">
          Omitir esta versión
        </button>
        <button
          id="btnRemindUpdate"
          class="px-4 py-2 rounded-xl bg-slate-800 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 transition min-h-[44px]"
        >
          Recordar mañana
        </button>
      </div>
    </div>
  </div>
</div>
