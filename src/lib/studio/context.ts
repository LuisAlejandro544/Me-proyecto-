// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { PRESET_SORA } from './data/presets';

// Single shared mutable state for the legacy studio (see ADR-002).
// New code should read via getStudioState() and migrate slices to Svelte stores.
export const ctx = {
  state: JSON.parse(JSON.stringify(PRESET_SORA)),
  activePresetKey: 'sora',
  selectedNodeId: 'start_scene_1',
  selectedWireId: null as unknown,
  historyStack: [] as unknown[],
  redoStack: [] as unknown[],
  sfxEnabled: true,
  audioCtx: null as unknown,
  dragState: null as unknown,
  currentPlayNodeId: null as unknown,
};
