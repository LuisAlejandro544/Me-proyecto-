// @ts-nocheck
// Studio barrel — orchestration entry. See docs/ARCHITECTURE.md.
import { ctx } from './context';
import { wireCanvasPanZoom } from './ui/viewport';
import { applyTransform } from './ui/transform';
import { captureCanvasShot } from './cover';
import { renderNodes } from './ui/render-nodes';
import { loadPreset } from './ui/load-preset';
import { startPlaytest } from './ui/playtest';
import { closePlaytest } from './ui/playtest';
import { renderPlaytestStep } from './ui/playtest';
import { openWorkspaceTab } from './ui/workspace';
import { playSynthSfx } from './domain/audio';
import { restoreInto, snapshotOf } from './domain/history';
import { showToast } from './ui/toast';
import { renderWires } from './ui/render-wires';
import { setZoom } from './ui/transform';
import { checkSharedPlayModeOnBoot, openShareModal } from './ui/share';
import { checkForUpdates, checkForUpdatesOnBoot } from './ui/updater';
import { deleteNode } from './ui/node-editor';
import { refreshScenePills, wireScenePills } from './ui/scenes';
import {
  getActiveSlot,
  getStartNodeId,
  loadSlots,
  normalizeState,
  renameProject,
  saveSessionNow,
  saveSlot,
  scheduleAutosave,
  syncProjectLabel,
} from './storage';

    
let __studioInited = false;
// Solo se autogurada al salir si el usuario llegó a entrar al editor
// (evita que el preset por defecto pise su última sesión al recargar en el menú).
let __editorActive = false;

/** Repinta el editor al volverlo visible (el menú lo mantiene oculto con display:none). */
export function enterEditor() {
  __editorActive = true;
  try { normalizeState(ctx.state); } catch {}
  syncProjectLabel();
  refreshSlotSaveButtons();
  try { applyTransform(); } catch {}
  try { renderNodes(); } catch {}
  try { refreshScenePills(); } catch {}
}

/** Etiquetas de los botones «Slot N» del desplegable (✓ en el activo + nombre). */
export function refreshSlotSaveButtons() {
  try {
    const slots = loadSlots();
    const active = getActiveSlot();
    document.querySelectorAll('.slot-save-btn').forEach((btn) => {
      const i = Number(btn.dataset.slotSave ?? btn.dataset.slot);
      const s = slots[i];
      const mark = active === i ? '✓ ' : '';
      btn.textContent = s ? `${mark}Slot ${i + 1}: ${s.name.slice(0, 12)}` : `${mark}Slot ${i + 1}`;
      btn.title = s ? `Guardar aquí (ahora: «${s.name}»)` : 'Guardar la historia actual en este slot';
    });
  } catch {}
}

export function getStudioState() {
  try { return typeof ctx.state !== 'undefined' ? ctx.state : null; } catch { return null; }
}

export function initStudio() {
  if (__studioInited) return;
  __studioInited = true;

      // Project Dropdown
      const projBtn = document.getElementById('btnProjectDropdown');
      const projMenu = document.getElementById('projectDropdownMenu');
      projBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        projMenu.classList.toggle('hidden');
        if (!projMenu.classList.contains('hidden')) {
          refreshSlotSaveButtons();
          const nameInput = document.getElementById('projectNameInput') as HTMLInputElement | null;
          if (nameInput && document.activeElement !== nameInput) nameInput.value = ctx.state.projectName || '';
        }
      });
      document.addEventListener('click', () => projMenu.classList.add('hidden'));

      // Nombre de la historia (se guarda en local al editar).
      const nameInput = document.getElementById('projectNameInput') as HTMLInputElement | null;
      nameInput?.addEventListener('click', (e) => e.stopPropagation());
      nameInput?.addEventListener('change', () => {
        __editorActive = true;
        renameProject(nameInput.value);
        projMenu.classList.add('hidden');
      });

      // Guardar la historia actual en uno de los 3 slots locales.
      document.querySelectorAll('.slot-save-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const i = Number((btn as HTMLElement).dataset.slotSave ?? (btn as HTMLElement).dataset.slot);
          if (!Number.isInteger(i) || i < 0 || i > 2) return;
          __editorActive = true;
          saveSlot(i);
          refreshSlotSaveButtons();
          // Portada real (Roblox-style): captura y re-guarda el slot con la imagen.
          try { captureCanvasShot(ctx.state.projectName, () => { saveSlot(i); refreshSlotSaveButtons(); }); } catch {}
          showToast(`💾 Guardado en slot ${i + 1} (este dispositivo)`);
        });
      });

      // Volver al menú principal (guarda la sesión para «Continuar»).
      document.getElementById('btnGoHome')?.addEventListener('click', () => {
        playSynthSfx('click');
        try { saveSessionNow(); } catch {}
        // Portada real al salir: captura el lienzo tal como quedó y re-guarda la sesión.
        try { captureCanvasShot(ctx.state.projectName, () => saveSessionNow()); } catch {}
        window.dispatchEvent(new CustomEvent('vn:go-home'));
      });
      // Seguridad: si cierra/recarga dentro del editor, la sesión queda para continuar.
      window.addEventListener('beforeunload', () => {
        if (__editorActive) {
          try { saveSessionNow(); } catch {}
        }
      });
      // Portada al ocultar la app (móvil en segundo plano / minimizar): última vista.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && __editorActive) {
          try { captureCanvasShot(ctx.state.projectName, () => saveSessionNow()); } catch {}
        }
      });

      document.querySelectorAll('.preset-option').forEach(btn => {
        btn.addEventListener('click', () => {
          loadPreset(btn.dataset.preset);
          try { refreshScenePills(); } catch {}
          projMenu.classList.add('hidden');
        });
      });

      // Las píldoras superiores ya NO cargan presets demo (borraban la historia
      // del usuario): ahora navegan por las escenas reales del proyecto.
      // Se conservan los ids #pillPresetSora/#pillPresetAoi por compatibilidad.
      try { wireScenePills(); } catch {}
      try { refreshScenePills(); } catch {}

      // Top bar buttons
      document.getElementById('btnPlayPreviewTop').addEventListener('click', startPlaytest);
      document.getElementById('btnShareLevel')?.addEventListener('click', openShareModal);
      document.getElementById('btnImportar')?.addEventListener('click', () => window.dispatchEvent(new CustomEvent('vn:open-export')));
      document.getElementById('btnTopSettings').addEventListener('click', () => openWorkspaceTab('settings'));
      document.getElementById('btnCheckUpdates')?.addEventListener('click', () => {
        playSynthSfx('click');
        showToast('Buscando actualizaciones… 🔍');
        checkForUpdates({ silent: false, manual: true });
      });

      // Undo / Redo
      document.getElementById('btnUndo').addEventListener('click', () => {
        if (!ctx.historyStack.length) {
          showToast('Nada que deshacer');
          return;
        }
        ctx.redoStack.push(snapshotOf(ctx.state));
        const prev = ctx.historyStack.pop();
        restoreInto(ctx.state, prev);
        playSynthSfx('click');
        syncProjectLabel();
        scheduleAutosave();
        renderNodes();
        showToast('Última acción deshecha');
      });

      document.getElementById('btnRedo').addEventListener('click', () => {
        if (!ctx.redoStack.length) {
          showToast('Nada que rehacer');
          return;
        }
        ctx.historyStack.push(snapshotOf(ctx.state));
        const next = ctx.redoStack.pop();
        restoreInto(ctx.state, next);
        playSynthSfx('click');
        syncProjectLabel();
        scheduleAutosave();
        renderNodes();
        showToast('Acción rehecha');
      });

      // Zoom / Pan controls
      document.getElementById('btnZoomResetTop').addEventListener('click', () => {
        ctx.state.panX = 20;
        ctx.state.panY = 15;
        setZoom(0.92);
      });
      document.getElementById('btnResetView').addEventListener('click', () => {
        ctx.state.panX = 20;
        ctx.state.panY = 15;
        setZoom(0.92);
        showToast('Vista centrada');
      });
      document.getElementById('btnZoomOutPill').addEventListener('click', () => setZoom(Math.max(0.45, ctx.state.zoom - 0.1)));
      document.getElementById('btnMinimapZoomOut').addEventListener('click', () => setZoom(Math.max(0.45, ctx.state.zoom - 0.1)));
      document.getElementById('btnMinimapZoomIn').addEventListener('click', () => setZoom(Math.min(1.5, ctx.state.zoom + 0.1)));
      document.getElementById('btnCenterCanvas').addEventListener('click', () => {
        ctx.state.panX = 20;
        ctx.state.panY = 15;
        applyTransform();
        renderWires();
      });
      document.getElementById('btnFitGraph').addEventListener('click', () => {
        ctx.state.panX = 30;
        ctx.state.panY = 20;
        setZoom(0.85);
      });

      // FAB Add Node
      document.getElementById('btnFabAddNode').addEventListener('click', () => openWorkspaceTab('nodes'));

      // Bottom Nav Tabs
      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => openWorkspaceTab(btn.dataset.tab));
      });

      // Drawer close
      document.getElementById('btnCloseDrawer').addEventListener('click', () => {
        document.getElementById('drawerModal').classList.add('hidden');
      });

      // Playtest modal controls
      document.getElementById('btnClosePlaytest').addEventListener('click', closePlaytest);
      document.getElementById('btnVnRestart').addEventListener('click', () => {
        const startId = getStartNodeId();
        if (startId) renderPlaytestStep(startId);
      });
      document.getElementById('btnVnToggleAudio').addEventListener('click', (e) => {
        ctx.sfxEnabled = !ctx.sfxEnabled;
        e.currentTarget.textContent = ctx.sfxEnabled ? '🔊 Sonido' : '🔇 Mudo';
      });

      // Initial render
  try { normalizeState(ctx.state); } catch {}
  syncProjectLabel();
  refreshSlotSaveButtons();
  wireCanvasPanZoom();
  applyTransform();
  renderNodes();
  try { refreshScenePills(); } catch {}
  // Supr / Backspace elimina el nodo seleccionado (fuera de inputs).
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && ctx.selectedNodeId) {
      const node = ctx.state.nodes.find((n) => n.id === ctx.selectedNodeId);
      if (!node) return;
      e.preventDefault();
      deleteNode(node.id);
    }
  });
  // Si la URL trae un nivel compartido (#nivel=…), entra en modo jugar a pantalla completa.
  checkSharedPlayModeOnBoot();
  // Auto-actualizaciones: escanea el último GitHub Release en segundo plano.
  checkForUpdatesOnBoot();
}

if (typeof window !== 'undefined') {
  (window as any).__studio = { initStudio, getStudioState, enterEditor, refreshSlotSaveButtons };
}

// Public zoom API (also used by automated visual tests).
export { setZoom } from './ui/transform';