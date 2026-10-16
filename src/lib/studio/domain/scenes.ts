// Dominio de escenas narrativas: nombre personalizable + nodo de inicio/fin.
// Una escena termina en un nodo (endNodeId) y la siguiente empieza en otro
// (startNodeId). Las decisiones pueden saltar directo con `gotoSceneId` y
// cualquier nodo puede continuar hacia una escena con `nextSceneId`.
import type { VNNode, VNScene, VNState } from '../../types';

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

export function nodeLabel(n: VNNode): string {
  return n.badge || n.headerBar || n.title || n.topTitle || n.speaker || n.id;
}

/** Lista de escenas garantizada (array, nunca null). */
export function getScenes(state: VNState): VNScene[] {
  if (!Array.isArray((state as VNState & { scenes?: VNScene[] }).scenes)) {
    (state as VNState & { scenes?: VNScene[] }).scenes = [];
  }
  return (state as VNState & { scenes?: VNScene[] }).scenes as VNScene[];
}

export function getSceneById(state: VNState, id?: string): VNScene | undefined {
  if (!id) return undefined;
  return getScenes(state).find((s) => s.id === id);
}

export function getSceneOfNode(state: VNState, nodeId: string): VNScene | undefined {
  const node = state.nodes.find((n) => n.id === nodeId);
  if (node?.sceneId) {
    const direct = getSceneById(state, node.sceneId);
    if (direct) return direct;
  }
  // Fallback: la escena que lo marca como inicio/fin.
  return getScenes(state).find((s) => s.startNodeId === nodeId || s.endNodeId === nodeId);
}

/** Nodo donde se juega una escena (su inicio; fallback: primer nodo de la escena). */
export function resolveSceneStartNode(state: VNState, sceneId?: string): string {
  if (!sceneId) return '';
  const scene = getSceneById(state, sceneId);
  if (!scene) return '';
  const ids = new Set(state.nodes.map((n) => n.id));
  if (scene.startNodeId && ids.has(scene.startNodeId)) return scene.startNodeId;
  const member = state.nodes.find((n) => n.sceneId === sceneId);
  if (member) return member.id;
  return '';
}

/** Escena siguiente en el orden de la lista (para «Continuar» al terminar una). */
export function getNextSceneInOrder(state: VNState, sceneId?: string): VNScene | undefined {
  const scenes = getScenes(state);
  if (!sceneId) return undefined;
  const i = scenes.findIndex((s) => s.id === sceneId);
  if (i < 0 || i + 1 >= scenes.length) return undefined;
  return scenes[i + 1];
}

/**
 * Destino de «Continuar» cuando un nodo no tiene cables de salida:
 * 1) `nextSceneId` explícito del nodo → inicio de esa escena.
 * 2) Si el nodo es fin de su escena → inicio de la escena siguiente.
 */
export function resolveContinueSceneTarget(state: VNState, nodeId: string): string {
  const node = state.nodes.find((n) => n.id === nodeId);
  if (!node) return '';
  if (node.nextSceneId) {
    const t = resolveSceneStartNode(state, node.nextSceneId);
    if (t) return t;
  }
  const owner =
    (node.sceneId && getSceneById(state, node.sceneId)) || getSceneOfNode(state, nodeId);
  if (owner && owner.endNodeId === nodeId) {
    const next = getNextSceneInOrder(state, owner.id);
    if (next) {
      const t = resolveSceneStartNode(state, next.id);
      if (t) return t;
    }
  }
  return '';
}

/** Crea la escena inicial por defecto cuando un proyecto aún no tiene ninguna. */
export function ensureScenes(state: VNState): VNScene[] {
  const scenes = getScenes(state);
  if (scenes.length) return scenes;
  const firstId = state.nodes[0]?.id;
  const scene: VNScene = {
    id: uid('escena'),
    name: 'Escena 1',
    startNodeId: firstId,
    endNodeId: undefined
  };
  scenes.push(scene);
  for (const n of state.nodes) {
    if (!n.sceneId) n.sceneId = scene.id;
  }
  return scenes;
}

/** Limpia referencias rotas (nodos borrados) y garantiza al menos una escena. */
export function normalizeScenes(state: VNState): VNScene[] {
  const scenes = getScenes(state);
  const ids = new Set(state.nodes.map((n) => n.id));
  for (const s of scenes) {
    if (typeof s.name !== 'string' || !s.name.trim()) s.name = 'Escena sin nombre';
    s.name = s.name.trim().slice(0, 60);
    if (s.startNodeId && !ids.has(s.startNodeId)) s.startNodeId = undefined;
    if (s.endNodeId && !ids.has(s.endNodeId)) s.endNodeId = undefined;
  }
  const sceneIds = new Set(scenes.map((s) => s.id));
  for (const n of state.nodes) {
    if (n.sceneId && !sceneIds.has(n.sceneId)) n.sceneId = undefined;
    if (n.nextSceneId && !sceneIds.has(n.nextSceneId)) n.nextSceneId = undefined;
    if (Array.isArray(n.options)) {
      for (const o of n.options) {
        if (o.gotoSceneId && !sceneIds.has(o.gotoSceneId)) o.gotoSceneId = undefined;
      }
    }
  }
  if (!scenes.length && state.nodes.length) ensureScenes(state);
  // Los nodos sin escena heredan la primera para que el reproductor siempre sepa dónde están.
  const fallback = scenes[0];
  if (fallback) {
    for (const n of state.nodes) {
      if (!n.sceneId) n.sceneId = fallback.id;
    }
    if (!fallback.startNodeId && state.nodes[0]) fallback.startNodeId = state.nodes[0].id;
  }
  return getScenes(state);
}

export function createScene(state: VNState, name?: string): VNScene {
  const scenes = ensureScenes(state);
  const scene: VNScene = {
    id: uid('escena'),
    name: (name || `Escena ${scenes.length + 1}`).trim().slice(0, 60) || `Escena ${scenes.length + 1}`,
    startNodeId: undefined,
    endNodeId: undefined
  };
  scenes.push(scene);
  return scene;
}

export function renameScene(state: VNState, id: string, name: string): boolean {
  const s = getSceneById(state, id);
  if (!s) return false;
  const clean = (name || '').trim().slice(0, 60);
  if (!clean) return false;
  s.name = clean;
  return true;
}

export function deleteScene(state: VNState, id: string): boolean {
  const scenes = getScenes(state);
  const i = scenes.findIndex((s) => s.id === id);
  if (i < 0) return false;
  scenes.splice(i, 1);
  for (const n of state.nodes) {
    if (n.sceneId === id) n.sceneId = scenes[0]?.id;
    if (n.nextSceneId === id) n.nextSceneId = undefined;
    for (const o of n.options ?? []) {
      if (o.gotoSceneId === id) o.gotoSceneId = undefined;
    }
  }
  // Si la primera escena quedó sin inicio, apunta al primer nodo.
  if (scenes[0] && !scenes[0].startNodeId && state.nodes[0]) {
    scenes[0].startNodeId = state.nodes[0].id;
  }
  return true;
}

export function moveScene(state: VNState, id: string, dir: -1 | 1): boolean {
  const scenes = getScenes(state);
  const i = scenes.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= scenes.length) return false;
  const [s] = scenes.splice(i, 1);
  scenes.splice(j, 0, s);
  return true;
}
