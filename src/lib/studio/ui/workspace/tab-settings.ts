// @ts-nocheck
// Workspace: pestaña ajustes (extraído de ui/workspace.ts — barrel en ui/workspace.ts).
import { ctx } from '../../context';
import { animateTabSwitch } from './tab-switch';
import { escapeHtml } from '../../domain/geometry';
import { showToast } from '../toast';
import { pushHistory } from '../../domain/history';
import { scheduleAutosave } from '../../storage';
import { openDialogueStudio } from '../dialogue';
import { getProjectDialogueThemeId, getDialogueTheme } from '../../../dialogue-themes';
import { ASSET_ENTER_ANIMATIONS, ASSET_MOTIONS, SCENE_TRANSITIONS, getProjectAssetDefaults } from '../../../asset-animations';
import { getCurrentVersion, getUpdateRepo, setUpdateRepo, checkForUpdates } from '../updater';

export function renderSettingsTab(modal: HTMLElement, titleEl: HTMLElement, bodyEl: HTMLElement, reopen: (t: string) => void, tabName: string) {
    titleEl.textContent = 'Ajustes globales y sintetizador de audio';
    bodyEl.innerHTML = `
      <div class="space-y-4">
        <div class="vn-anim-card p-3.5 rounded-xl bg-[#101528] border border-emerald-500/30">
          <div class="flex items-center justify-between gap-2">
            <div>
              <div class="font-semibold text-white text-sm">🔄 Actualizaciones automáticas</div>
              <div class="text-xs text-slate-400">La app revisa el último GitHub Release y te avisa con pantalla</div>
            </div>
            <span id="settingsAppVersion" class="text-[11px] font-mono px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 shrink-0">v…</span>
          </div>
          <label class="block mt-3">
            <span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Repo de releases (propietario/repo)</span>
            <input id="updateRepoInput" spellcheck="false"
              class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-400 min-h-[44px]" />
          </label>
          <div class="flex flex-wrap gap-2 mt-3">
            <button id="btnSettingsCheckUpdates" class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 min-h-[44px]">
              🔍 Buscar actualizaciones
            </button>
            <button id="btnSettingsSaveRepo" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 min-h-[44px]">
              Guardar repo
            </button>
          </div>
          <p class="text-[11px] text-slate-500 mt-2">Canal: workflow «Auto-update» (solo al publicar un release o manual, nunca por commits/PRs). En escritorio descarga el instalador de tu sistema y lo abre para actualizar de verdad; en Android descarga el APK; en web la actualización se aplica con «Recargar app». El .zip es el portable y no se auto-instala.</p>
        </div>
        <div class="vn-anim-card flex items-center justify-between p-3.5 rounded-xl bg-[#101528] border border-fuchsia-500/30">
          <div>
            <div class="font-semibold text-white text-sm">💬 Cuadros de diálogo personalizados</div>
            <div class="text-xs text-slate-400">Diseños importados + tipografías + animación de letras · global: ${escapeHtml(getDialogueTheme(getProjectDialogueThemeId(ctx.state)).name)}</div>
          </div>
          <button id="btnOpenDialogueStudio" class="px-4 py-1.5 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 text-xs font-bold text-white min-h-[44px] shrink-0">
            Personalizar
          </button>
        </div>
        <div class="vn-anim-card p-3.5 rounded-xl bg-[#101528] border border-cyan-500/30 space-y-2.5">
          <div class="font-semibold text-white text-sm">🎞 Animaciones globales de assets y escenarios</div>
          <p class="text-xs text-slate-400">Aparición del sprite, movimiento en bucle y transición entre escenarios. Cada nodo y cada escena pueden overriding estos valores.</p>
          ${(() => { const d = getProjectAssetDefaults(ctx.state); return `
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label class="block">
              <span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Aparición</span>
              <select id="setAssetEnter" class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-2.5 py-2 text-xs text-white min-h-[44px]">
                ${ASSET_ENTER_ANIMATIONS.map((a) => `<option value="${a.id}" ${d.enter === a.id ? 'selected' : ''}>${a.label}</option>`).join('')}
              </select>
            </label>
            <label class="block">
              <span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Movimiento</span>
              <select id="setAssetMotion" class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-2.5 py-2 text-xs text-white min-h-[44px]">
                ${ASSET_MOTIONS.map((a) => `<option value="${a.id}" ${d.motion === a.id ? 'selected' : ''}>${a.label}</option>`).join('')}
              </select>
            </label>
            <label class="block">
              <span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Transición</span>
              <select id="setSceneTrans" class="w-full rounded-xl bg-[#0f1428] border border-slate-600 px-2.5 py-2 text-xs text-white min-h-[44px]">
                ${SCENE_TRANSITIONS.map((a) => `<option value="${a.id}" ${d.transition === a.id ? 'selected' : ''}>${a.label}</option>`).join('')}
              </select>
            </label>
          </div>
          <label class="block">
            <span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Duración (${d.durationMs} ms)</span>
            <input id="setAnimDur" type="range" min="120" max="2000" step="10" value="${d.durationMs}" class="vn-slider mt-3" />
          </label>`; })()}
        </div>
        <div class="vn-anim-card flex items-center justify-between p-3.5 rounded-xl bg-[#101528] border border-slate-700">
          <div>
            <div class="font-semibold text-white text-sm">Efectos de sonido de la interfaz y la novela</div>
            <div class="text-xs text-slate-400">Timbres Web Audio al conectar nodos o elegir opciones</div>
          </div>
          <button id="btnModalToggleSfx" class="px-4 py-1.5 rounded-lg text-xs font-bold min-h-[44px] ${ctx.sfxEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}">
            ${ctx.sfxEnabled ? 'Activado' : 'Silenciado'}
          </button>
        </div>
        <div class="vn-anim-card flex items-center justify-between p-3.5 rounded-xl bg-[#101528] border border-slate-700">
          <div>
            <div class="font-semibold text-white text-sm">Exportar proyecto como JSON</div>
            <div class="text-xs text-slate-400">Guarda tu grafo de nodos y variables como JSON</div>
          </div>
          <button id="btnDownloadJson" class="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white min-h-[44px]">
            Descargar .json
          </button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
    animateTabSwitch(tabName);
    document.getElementById('btnOpenDialogueStudio')!.onclick = () => {
      openDialogueStudio();
    };
    {
      const enterSel = document.getElementById('setAssetEnter') as HTMLSelectElement | null;
      const motionSel = document.getElementById('setAssetMotion') as HTMLSelectElement | null;
      const transSel = document.getElementById('setSceneTrans') as HTMLSelectElement | null;
      const durRange = document.getElementById('setAnimDur') as HTMLInputElement | null;
      const saveGlobals = () => {
        pushHistory();
        if (enterSel) (ctx.state as Record<string, unknown>).defaultAssetEnter = enterSel.value || undefined;
        if (motionSel) (ctx.state as Record<string, unknown>).defaultAssetMotion = motionSel.value || undefined;
        if (transSel) (ctx.state as Record<string, unknown>).defaultSceneTransition = transSel.value || undefined;
        if (durRange) (ctx.state as Record<string, unknown>).animDurationMs = Number(durRange.value) || undefined;
        scheduleAutosave();
        showToast('Animaciones globales guardadas 🎞');
      };
      if (enterSel) enterSel.onchange = saveGlobals;
      if (motionSel) motionSel.onchange = saveGlobals;
      if (transSel) transSel.onchange = saveGlobals;
      if (durRange) durRange.onchange = saveGlobals;
    }
    document.getElementById('btnModalToggleSfx').onclick = () => {
      ctx.sfxEnabled = !ctx.sfxEnabled;
      reopen('settings');
    };
    document.getElementById('btnDownloadJson').onclick = () => {
      const blob = new Blob([JSON.stringify(ctx.state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mi_novela_proyecto.json';
      a.click();
      showToast('«mi_novela_proyecto.json» descargado');
    };
    // Auto-actualizaciones: versión visible + repo editable + chequeo manual.
    try {
      const vEl = document.getElementById('settingsAppVersion');
      if (vEl) vEl.textContent = `v${getCurrentVersion()}`;
      const repoInput = document.getElementById('updateRepoInput') as HTMLInputElement | null;
      if (repoInput) repoInput.value = getUpdateRepo();
      const btnCheck = document.getElementById('btnSettingsCheckUpdates');
      if (btnCheck) {
        (btnCheck as HTMLElement).onclick = async () => {
          (btnCheck as HTMLButtonElement).textContent = 'Buscando… 🔍';
          await checkForUpdates({ silent: false, manual: true });
          (btnCheck as HTMLButtonElement).textContent = '🔍 Buscar actualizaciones';
        };
      }
      const btnRepo = document.getElementById('btnSettingsSaveRepo');
      if (btnRepo) {
        (btnRepo as HTMLElement).onclick = () => {
          setUpdateRepo(repoInput?.value ?? '');
          showToast('Repo de actualizaciones guardado 🔄');
        };
      }
    } catch {}

}
