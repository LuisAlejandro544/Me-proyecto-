// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { scheduleAutosave } from '../storage';

export function pushHistory() {
  ctx.historyStack.push(JSON.parse(JSON.stringify({ nodes: ctx.state.nodes, wires: ctx.state.wires, variables: ctx.state.variables, startNodeId: ctx.state.startNodeId, projectName: ctx.state.projectName, dialogueThemeId: ctx.state.dialogueThemeId, scenes: ctx.state.scenes })));
  if (ctx.historyStack.length > 30) ctx.historyStack.shift();
  ctx.redoStack = [];
  try { scheduleAutosave(); } catch {}
}
