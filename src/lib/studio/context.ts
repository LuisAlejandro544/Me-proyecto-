// Single shared mutable state for the legacy studio (see ADR-002).
// Fully typed: template for removing `// @ts-nocheck` module by module.
// New code should read via getStudioState() and migrate slices to Svelte stores.
import { PRESET_SORA } from './data/presets';
import type { DragState, GraphSnapshot, VNState } from '../types';

export const ctx: {
  state: VNState;
  activePresetKey: string;
  selectedNodeId: string;
  historyStack: GraphSnapshot[];
  redoStack: GraphSnapshot[];
  sfxEnabled: boolean;
  audioCtx: AudioContext | null;
  dragState: DragState | null;
  currentPlayNodeId: string | null;
} = {
  state: JSON.parse(JSON.stringify(PRESET_SORA)) as VNState,
  activePresetKey: 'sora',
  selectedNodeId: 'start_scene_1',
  historyStack: [],
  redoStack: [],
  sfxEnabled: true,
  audioCtx: null,
  dragState: null,
  currentPlayNodeId: null,
};
