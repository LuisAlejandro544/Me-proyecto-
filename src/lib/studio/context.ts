// Single shared mutable state for the legacy studio (see ADR-002).
// Fully typed: template for removing `// @ts-nocheck` module by module.
// New code should read via getStudioState() and migrate slices to Svelte stores.
// Desacoplo progresivo: los accesores de abajo son la vía preferida;
// `ctx` queda como compat legacy (no importar en código nuevo).
import { PRESET_SORA } from './data/presets';
import type { DragState, GraphSnapshot, VNNode, VNState } from '../types';

export const ctx: {
  state: VNState;
  activePresetKey: string;
  selectedNodeId: string;
  selectedWireId: string | null;
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
  selectedWireId: null,
  historyStack: [],
  redoStack: [],
  sfxEnabled: true,
  audioCtx: null,
  dragState: null,
  currentPlayNodeId: null,
};

/** Vía preferida (nuevo código): lee el estado sin importar el singleton mutable. */
export function getStudioState(): VNState {
  return ctx.state;
}

/** Id del nodo seleccionado ('' = ninguno). */
export function getSelectedNodeId(): string {
  return ctx.selectedNodeId;
}

/** Nodo seleccionado o null (solo si tiene diálogo editable). */
export function getSelectedNode(): VNNode | null {
  const id = ctx.selectedNodeId;
  if (!id) return null;
  return ctx.state.nodes.find((n) => n.id === id) ?? null;
}

/** Selecciona un nodo ('' = deseleccionar). */
export function selectNode(id: string): void {
  ctx.selectedNodeId = id;
}
