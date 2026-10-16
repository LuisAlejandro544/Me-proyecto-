// @ts-nocheck
// Compilador: formato portable .vn.json (extraído de ui/compile.ts — ver barrel ui/compile.ts).
import { ctx } from '../../context';
import { getStartNodeId } from '../../storage';
import { getCharacterCatalog, getCustomAssets } from '../../../assets';
import { CHARACTER_ASSETS } from '../../data/assets';
import { getAllDialogueThemes, getProjectDialogueThemeId } from '../../../dialogue-themes';
import { getProjectAssetDefaults } from '../../../asset-animations';
export function buildHistoria(): Record<string, unknown> {
  const catalog = getCharacterCatalog();
  const customs: Record<string, unknown> = {};
  for (const a of getCustomAssets()) {
    customs[a.id] = { dataUrl: a.dataUrl, mime: a.mime, kind: a.kind, name: a.name };
  }
  return {
    v: 1,
    proyecto: ctx.state.projectName || 'Mi Novela',
    startNodeId: getStartNodeId(ctx.state),
    scenes: ctx.state.scenes ?? [],
    nodes: ctx.state.nodes,
    wires: ctx.state.wires,
    variables: ctx.state.variables ?? {},
    dialogueThemeId: getProjectDialogueThemeId(ctx.state),
    dialogueThemes: getAllDialogueThemes(),
    defaultAssetEnter: (ctx.state as { defaultAssetEnter?: string }).defaultAssetEnter,
    defaultAssetMotion: (ctx.state as { defaultAssetMotion?: string }).defaultAssetMotion,
    defaultSceneTransition: (ctx.state as { defaultSceneTransition?: string }).defaultSceneTransition,
    animDurationMs: (ctx.state as { animDurationMs?: number }).animDurationMs,
    assets: { catalog, customs }
  };
}

/** Solo los assets usados (el .html pesa menos que incrustando todo el catálogo). */
export function collectUsedPayload(): { nodes: unknown[]; wires: unknown[]; assets: Record<string, unknown>; customs: Record<string, unknown>; dialogueThemes: Record<string, unknown>; dialogueThemeId: string; scenes: unknown[]; animDefaults: Record<string, unknown> } {
  const fullCatalog = getCharacterCatalog();
  const usedChars = new Set<string>();
  for (const n of ctx.state.nodes) {
    if (n.characterId && fullCatalog[n.characterId]) usedChars.add(n.characterId);
    if (n.selectedCharId && fullCatalog[n.selectedCharId]) usedChars.add(n.selectedCharId);
  }
  const assets: Record<string, unknown> = {};
  for (const id of usedChars) {
    if (fullCatalog[id]) assets[id] = fullCatalog[id];
  }
  const customsAll = new Map(getCustomAssets().map((a) => [a.id, a]));
  const customs: Record<string, unknown> = {};
  for (const n of ctx.state.nodes) {
    for (const ref of [n.videoAssetId, n.soundAssetId, n.audioAssetId]) {
      const a = ref ? customsAll.get(ref) : undefined;
      if (a) customs[a.id] = { dataUrl: a.dataUrl, mime: a.mime, kind: a.kind, name: a.name };
    }
    // Sprites personalizados usados como personaje (viven en customs como imagen).
    for (const ref of [n.characterId, n.selectedCharId]) {
      const a = ref ? customsAll.get(ref) : undefined;
      if (a && a.kind === 'imagen') {
        assets[a.id] = { id: a.id, name: a.name, color: '#22d3ee', avatar: a.dataUrl, banner: a.dataUrl, expressions: ['Personalizado'], custom: true };
      }
    }
  }
  // Solo los diseños de diálogo usados (global + overrides por nodo).
  const allThemes = new Map(getAllDialogueThemes().map((t) => [t.id, t]));
  const dialogueThemeId = getProjectDialogueThemeId(ctx.state);
  const usedThemeIds = new Set<string>([dialogueThemeId]);
  for (const n of ctx.state.nodes) {
    if (n.dlgThemeId && n.dlgThemeId !== 'global') usedThemeIds.add(n.dlgThemeId);
  }
  const dialogueThemes = {};
  for (const id of usedThemeIds) {
    const t = allThemes.get(id);
    if (t) dialogueThemes[id] = t;
  }
  // Garantiza al menos el tema global aunque la biblioteca haya cambiado.
  if (!dialogueThemes[dialogueThemeId] && allThemes.get(dialogueThemeId)) {
    dialogueThemes[dialogueThemeId] = allThemes.get(dialogueThemeId);
  }
  const animDefaults = getProjectAssetDefaults(ctx.state);
  return { nodes: ctx.state.nodes, wires: ctx.state.wires, assets, customs, dialogueThemes, dialogueThemeId, scenes: ctx.state.scenes ?? [], animDefaults };
}
