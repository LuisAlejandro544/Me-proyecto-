// @ts-nocheck
// Compilador: validación del grafo (extraído de ui/compile.ts — ver barrel ui/compile.ts).
import { ctx } from '../../context';
import { getStartNodeId } from '../../storage';
import { getCustomAssets } from '../../../assets';
import type { StoryIssue } from './types';
export function validateStory(): StoryIssue[] {
  const issues: StoryIssue[] = [];
  const nodes = ctx.state?.nodes ?? [];
  const wires = ctx.state?.wires ?? [];
  if (!nodes.length) {
    issues.push({ level: 'error', msg: 'La historia no tiene nodos: añade al menos una escena.' });
    return issues;
  }
  const ids = new Set(nodes.map((n) => n.id));
  const startId = getStartNodeId(ctx.state);
  if (!startId || !ids.has(startId)) {
    issues.push({ level: 'error', msg: 'No hay nodo inicial válido (se usará la primera escena).' });
  }
  const customs = new Map(getCustomAssets().map((a) => [a.id, a]));
  const outOf = (id: string) => wires.filter((w) => w.fromNode === id);
  const reachable = new Set<string>();
  if (startId && ids.has(startId)) {
    const queue = [startId];
    reachable.add(startId);
    while (queue.length) {
      const cur = queue.pop();
      for (const w of outOf(cur)) {
        if (ids.has(w.toNode) && !reachable.has(w.toNode)) {
          reachable.add(w.toNode);
          queue.push(w.toNode);
        }
      }
    }
    for (const n of nodes) {
      if (!reachable.has(n.id)) {
        const label = n.badge || n.headerBar || n.title || n.id;
        issues.push({ level: 'aviso', msg: `«${label}» es inalcanzable desde el inicio (quedará fuera del camino principal).` });
      }
    }
  }
  for (const n of nodes) {
    const label = n.badge || n.headerBar || n.title || n.id;
    if (n.type === 'choice') {
      if (!n.options?.length) {
        issues.push({ level: 'error', msg: `«${label}» es de decisión pero no tiene opciones.` });
      } else {
        for (const o of n.options) {
          const hasWire = outOf(n.id).some((w) => w.fromPort === `out_${o.id}`);
          if (!hasWire && !o.gotoSceneId && !n.nextSceneId) {
            issues.push({ level: 'aviso', msg: `«${label}» → «${o.label}» no tiene cable ni escena de salto (mostrará fin de rama).` });
          } else if (!hasWire && (o.gotoSceneId || n.nextSceneId)) {
            const targetId = o.gotoSceneId || n.nextSceneId;
            const scene = (ctx.state.scenes ?? []).find((s) => s.id === targetId);
            if (!scene) {
              issues.push({ level: 'error', msg: `«${label}» → «${o.label}» apunta a una escena eliminada. Reasígnala.` });
            } else if (!scene.startNodeId || !ids.has(scene.startNodeId)) {
              const member = nodes.find((x) => x.sceneId === scene.id);
              if (!member) {
                issues.push({ level: 'aviso', msg: `«${label}» → «${o.label}» salta a «${scene.name}», pero esa escena no tiene inicio (no saltará).` });
              }
            }
          }
        }
      }
    } else if (!outOf(n.id).length) {
      // Un solo final sin salida es normal; varios huérfanos intermedios avisan.
      // Los nodos `ending` son finales por diseño: nunca avisan por no tener salida.
      if (n.type === 'ending') {
        const outs = outOf(n.id).length;
        if (outs > 0) {
          issues.push({ level: 'aviso', msg: `«${label}» es un final pero tiene salida (los finales suelen ser terminales).` });
        }
      } else {
      // Un solo final sin salida es normal; varios huérfanos intermedios avisan.
      const outs = outOf(n.id).length;
      if (outs === 0 && reachable.size > 1 && n.id !== startId && nodes.length > 1) {
        // Solo avisa si el nodo tiene entradas (es un final prematuro en mitad del grafo).
        const hasIn = wires.some((w) => w.toNode === n.id);
        if (hasIn && ![...reachable].every((id) => id === n.id)) {
          issues.push({ level: 'aviso', msg: `«${label}» no tiene salida (será un final de rama).` });
        }
      }
      }
    }
    if (n.type === 'video_scene' && !n.videoAssetId) {
      issues.push({ level: 'aviso', msg: `«${label}» es de vídeo pero no tiene recurso asignado.` });
    }
    if (n.type === 'sound_cue' && !(n.soundAssetId || n.audioAssetId)) {
      issues.push({ level: 'aviso', msg: `«${label}» es de sonido pero no tiene audio asignado.` });
    }
    if (n.type === 'background' && !n.backgroundAssetId) {
      issues.push({ level: 'aviso', msg: `«${label}» es de fondo pero no tiene imagen asignada.` });
    }
    if (n.type === 'jump') {
      const hasWire = outOf(n.id).length > 0;
      if (!hasWire && !n.jumpNodeId && !n.jumpSceneId && !n.nextSceneId) {
        issues.push({ level: 'aviso', msg: `«${label}» es un salto sin destino (cable, nodo o escena).` });
      }
      if (n.jumpNodeId && !ids.has(n.jumpNodeId)) {
        issues.push({ level: 'error', msg: `«${label}» salta a un nodo borrado. Elige otro destino.` });
      }
      if (n.jumpSceneId) {
        const scene = (ctx.state.scenes ?? []).find((s) => s.id === n.jumpSceneId);
        if (!scene) {
          issues.push({ level: 'error', msg: `«${label}» salta a una escena eliminada. Reasígnala.` });
        } else if (!scene.startNodeId || !ids.has(scene.startNodeId)) {
          const member = nodes.find((x) => x.sceneId === scene.id);
          if (!member) {
            issues.push({ level: 'aviso', msg: `«${label}» salta a «${scene.name}», pero esa escena no tiene inicio (no saltará).` });
          }
        }
      }
    }
    if (n.type === 'ending' && !n.endingKind) {
      issues.push({ level: 'aviso', msg: `«${label}» es un final sin tipo (se contará como neutral).` });
    }
    for (const ref of [n.videoAssetId, n.soundAssetId, n.audioAssetId, n.backgroundAssetId]) {
      if (ref && !customs.has(ref)) {
        issues.push({ level: 'error', msg: `«${label}» usa un recurso eliminado (${String(ref).slice(0, 24)}…). Reasígnalo.` });
        break;
      }
    }
    if (n.type !== 'choice' && n.type !== 'character_selector' && n.type !== 'jump' && n.type !== 'background' && !(n.dialogue ?? '').trim() && !(n.type === 'ending' && (n.endingTitle ?? '').trim())) {
      issues.push({ level: 'aviso', msg: `«${label}» no tiene diálogo (saldrá vacío).` });
    }
  }
  for (const w of wires) {
    if (!ids.has(w.fromNode) || !ids.has(w.toNode)) {
      issues.push({ level: 'error', msg: `Hay un cable roto (${w.fromNode} → ${w.toNode}). Bórralo y reconecta.` });
      break;
    }
  }
  // Escenas: avisos si el inicio/fin quedó sin asignar o apunta a nodos borrados.
  try {
    const scenes = ctx.state.scenes ?? [];
    const seenNames = new Set<string>();
    for (const s of scenes) {
      const nm = (s.name || '').trim();
      if (!nm) issues.push({ level: 'error', msg: 'Hay una escena sin nombre: ponle uno en la pestaña Escenas.' });
      else if (seenNames.has(nm.toLowerCase())) {
        issues.push({ level: 'aviso', msg: `Hay dos escenas llamadas «${nm}»: ponles nombres distintos.` });
      } else seenNames.add(nm.toLowerCase());
      if (s.startNodeId && !ids.has(s.startNodeId)) {
        issues.push({ level: 'error', msg: `«${nm || s.id}» empieza en un nodo borrado. Elige otro inicio.` });
      }
      if (s.endNodeId && !ids.has(s.endNodeId)) {
        issues.push({ level: 'error', msg: `«${nm || s.id}» termina en un nodo borrado. Elige otro fin.` });
      }
      if (!s.startNodeId) {
        issues.push({ level: 'aviso', msg: `«${nm || s.id}» no tiene nodo de inicio (Jugar desde ahí no saltará).` });
      }
      const members = nodes.filter((x) => x.sceneId === s.id).length;
      if (!members && !s.startNodeId && !s.endNodeId) {
        issues.push({ level: 'aviso', msg: `«${nm || s.id}» está vacía (sin nodos ni inicio/fin).` });
      }
    }
  } catch {}
  return issues;
}

