// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { scheduleAutosave } from '../storage';
import type { GraphSnapshot, VNState } from '../../types';

/** Foto completa del estado para deshacer/rehacer (un solo constructor). */
export function snapshotOf(state: VNState): GraphSnapshot {
  return JSON.parse(JSON.stringify({
    nodes: state.nodes,
    wires: state.wires,
    variables: state.variables,
    startNodeId: (state as { startNodeId?: string }).startNodeId,
    projectName: state.projectName,
    dialogueThemeId: (state as { dialogueThemeId?: string }).dialogueThemeId,
    scenes: state.scenes,
    defaultAssetEnter: (state as { defaultAssetEnter?: string }).defaultAssetEnter,
    defaultAssetMotion: (state as { defaultAssetMotion?: string }).defaultAssetMotion,
    defaultSceneTransition: (state as { defaultSceneTransition?: string }).defaultSceneTransition,
    animDurationMs: (state as { animDurationMs?: number }).animDurationMs,
  }));
}

/** Restaura una foto sobre el estado vivo (con guardas para fotos antiguas). */
export function restoreInto(state: VNState, snap: GraphSnapshot): void {
  state.nodes = snap.nodes;
  state.wires = snap.wires;
  state.variables = snap.variables;
  if (typeof snap.startNodeId !== 'undefined') (state as { startNodeId?: string }).startNodeId = snap.startNodeId;
  if (typeof snap.projectName === 'string') state.projectName = snap.projectName;
  if (typeof snap.dialogueThemeId !== 'undefined') (state as { dialogueThemeId?: string }).dialogueThemeId = snap.dialogueThemeId;
  if (typeof snap.scenes !== 'undefined') state.scenes = snap.scenes;
  if (typeof snap.defaultAssetEnter !== 'undefined') (state as { defaultAssetEnter?: string }).defaultAssetEnter = snap.defaultAssetEnter;
  if (typeof snap.defaultAssetMotion !== 'undefined') (state as { defaultAssetMotion?: string }).defaultAssetMotion = snap.defaultAssetMotion;
  if (typeof snap.defaultSceneTransition !== 'undefined') (state as { defaultSceneTransition?: string }).defaultSceneTransition = snap.defaultSceneTransition;
  if (typeof snap.animDurationMs !== 'undefined') (state as { animDurationMs?: number }).animDurationMs = snap.animDurationMs;
}

export function pushHistory() {
  ctx.historyStack.push(snapshotOf(ctx.state));
  if (ctx.historyStack.length > 30) ctx.historyStack.shift();
  ctx.redoStack = [];
  try { scheduleAutosave(); } catch {}
}
