// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';

export function pushHistory() {
  ctx.historyStack.push(JSON.parse(JSON.stringify({ nodes: ctx.state.nodes, wires: ctx.state.wires, variables: ctx.state.variables })));
  if (ctx.historyStack.length > 30) ctx.historyStack.shift();
  ctx.redoStack = [];
}
