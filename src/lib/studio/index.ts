// @ts-nocheck
// Studio barrel — orchestration entry. See docs/ARCHITECTURE.md.
import { ctx } from './context';
import { wireCanvasPanZoom } from './ui/viewport';
import { applyTransform } from './ui/transform';
import { renderNodes } from './ui/render-nodes';
import { loadPreset } from './ui/load-preset';
import { startPlaytest } from './ui/playtest';
import { closePlaytest } from './ui/playtest';
import { exportStandaloneHtml } from './ui/exporter';
import { openExeExportModal } from './ui/exporter';
import { openWorkspaceTab } from './ui/workspace';
import { playSynthSfx } from './domain/audio';
import { showToast } from './ui/toast';
import { renderWires } from './ui/render-wires';
import { setZoom } from './ui/transform';
import { checkSharedPlayModeOnBoot, openShareModal } from './ui/share';
import { deleteNode } from './ui/node-editor';

    
let __studioInited = false;

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
      });
      document.addEventListener('click', () => projMenu.classList.add('hidden'));

      document.querySelectorAll('.preset-option').forEach(btn => {
        btn.addEventListener('click', () => {
          loadPreset(btn.dataset.preset);
          projMenu.classList.add('hidden');
        });
      });

      document.getElementById('pillPresetSora').addEventListener('click', () => loadPreset('sora'));
      document.getElementById('pillPresetAoi').addEventListener('click', () => loadPreset('aoi'));

      // Top bar buttons
      document.getElementById('btnPlayPreviewTop').addEventListener('click', startPlaytest);
      document.getElementById('btnShareLevel')?.addEventListener('click', openShareModal);
      document.getElementById('btnExportHtml').addEventListener('click', exportStandaloneHtml);
      document.getElementById('btnExportExe').addEventListener('click', openExeExportModal);
      document.getElementById('btnTopSettings').addEventListener('click', () => openWorkspaceTab('settings'));

      // Undo / Redo
      document.getElementById('btnUndo').addEventListener('click', () => {
        if (!ctx.historyStack.length) {
          showToast('Nada que deshacer');
          return;
        }
        ctx.redoStack.push(JSON.parse(JSON.stringify({ nodes: ctx.state.nodes, wires: ctx.state.wires, variables: ctx.state.variables })));
        const prev = ctx.historyStack.pop();
        ctx.state.nodes = prev.nodes;
        ctx.state.wires = prev.wires;
        ctx.state.variables = prev.variables;
        playSynthSfx('click');
        renderNodes();
        showToast('Última acción deshecha');
      });

      document.getElementById('btnRedo').addEventListener('click', () => {
        if (!ctx.redoStack.length) {
          showToast('Nada que rehacer');
          return;
        }
        ctx.historyStack.push(JSON.parse(JSON.stringify({ nodes: ctx.state.nodes, wires: ctx.state.wires, variables: ctx.state.variables })));
        const next = ctx.redoStack.pop();
        ctx.state.nodes = next.nodes;
        ctx.state.wires = next.wires;
        ctx.state.variables = next.variables;
        playSynthSfx('click');
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
        if (ctx.state.nodes[0]) renderPlaytestStep(ctx.state.nodes[0].id);
      });
      document.getElementById('btnVnToggleAudio').addEventListener('click', (e) => {
        ctx.sfxEnabled = !ctx.sfxEnabled;
        e.currentTarget.textContent = ctx.sfxEnabled ? '🔊 Sonido' : '🔇 Mudo';
      });

      // Initial render
  wireCanvasPanZoom();
  applyTransform();
  renderNodes();
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
}

if (typeof window !== 'undefined') {
  (window as any).__studio = { initStudio, getStudioState };
}

// Public zoom API (also used by automated visual tests).
export { setZoom } from './ui/transform';