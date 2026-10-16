// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { PRESET_AOI, PRESET_SORA } from '../data/presets';
import { playSynthSfx } from '../domain/audio';
import { renderNodes } from './render-nodes';
import { applyTransform } from './transform';
import { normalizeState, syncProjectLabel, scheduleAutosave, setActiveSlot } from '../storage';
import { refreshScenePills } from './scenes';

export function loadPreset(presetKey) {
  playSynthSfx('click');
  ctx.activePresetKey = presetKey;
  if (presetKey === 'sora') {
    ctx.state = JSON.parse(JSON.stringify(PRESET_SORA));
    ctx.selectedNodeId = 'start_scene_1';
  } else if (presetKey === 'aoi') {
    ctx.state = JSON.parse(JSON.stringify(PRESET_AOI));
    ctx.selectedNodeId = 'node_1_intro';
  } else {
    ctx.state = {
      projectName: 'Mi Novela (personalizada)',
      zoom: 0.92,
      panX: 40,
      panY: 40,
      variables: { chapter: 1 },
      scenes: [{ id: 'escena_1', name: 'Escena 1', startNodeId: 'start_1', endNodeId: undefined }],
      nodes: [
        {
          id: 'start_1',
          type: 'banner_scene',
          badge: 'Escena inicial 1',
          sceneId: 'escena_1',
          x: 120,
          y: 120,
          width: 245,
          characterId: undefined,
          speaker: 'Narrador',
          speakerColor: '#94a3b8',
          dialogue: '¡Bienvenido a tu nueva novela visual!\nToca ✏️ y elige un personaje para empezar.',
          portsOut: [{ id: 'out_cyan', color: 'cyan', yOffset: 160 }]
        }
      ],
      wires: []
    };
    ctx.selectedNodeId = 'start_1';
  }

  // Update quick switcher pills
  const pillSora = document.getElementById('pillPresetSora');
  const pillAoi = document.getElementById('pillPresetAoi');
  if (presetKey === 'sora' && pillSora && pillAoi) {
    pillSora.className = 'px-3 py-1 rounded-full text-xs font-semibold transition bg-cyan-500/20 text-cyan-300 border border-cyan-400/40';
    pillAoi.className = 'px-3 py-1 rounded-full text-xs font-semibold transition text-slate-400 hover:text-white';
  } else if (presetKey === 'aoi' && pillSora && pillAoi) {
    pillAoi.className = 'px-3 py-1 rounded-full text-xs font-semibold transition bg-rose-500/20 text-rose-300 border border-rose-400/40';
    pillSora.className = 'px-3 py-1 rounded-full text-xs font-semibold transition text-slate-400 hover:text-white';
  }

  normalizeState(ctx.state);
  try { setActiveSlot(null); } catch {}
  try { scheduleAutosave(); } catch {}
  syncProjectLabel();
  // Limpia selección de cable/popover del preset anterior (eran del otro grafo).
  ctx.selectedWireId = null;
  document.querySelectorAll('.vn-wire-group.wire-selected').forEach((g) => g.classList.remove('wire-selected'));
  document.getElementById('wirePopover')?.classList.add('wire-pop-hidden');
  applyTransform();
  renderNodes();
  // Las píldoras ahora reflejan las escenas reales (ver ui/scenes.ts).
  try { refreshScenePills(); } catch {}
}
