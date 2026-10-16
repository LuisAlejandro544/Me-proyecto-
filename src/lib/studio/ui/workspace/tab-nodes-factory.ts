// @ts-nocheck
// Workspace: fábrica de nodos nuevos (extraído de ui/workspace.ts — barrel en ui/workspace.ts).
import { ctx } from '../../context';
import { pushHistory } from '../../domain/history';
import { renderNodes } from '../render-nodes';
import { showToast } from '../toast';
import { ensureScenes } from '../../domain/scenes';
export function addNewNodeOfType(type) {
  pushHistory();
  const id = 'node_' + Date.now().toString(36);
  const offsetX = Math.round((180 - ctx.state.panX) / ctx.state.zoom + (Math.random() * 80));
  const offsetY = Math.round((140 - ctx.state.panY) / ctx.state.zoom + (Math.random() * 60));
  // Los nodos nuevos heredan la última escena para no quedar huérfanos.
  let defaultSceneId: string | undefined;
  try {
    const scenes = ensureScenes(ctx.state);
    defaultSceneId = scenes[scenes.length - 1]?.id;
  } catch {
    defaultSceneId = undefined;
  }

  if (type === 'banner_scene') {
    ctx.state.nodes.push({
      id,
      type: 'banner_scene',
      badge: `Escena ${ctx.state.nodes.length + 1}`,
      sceneId: defaultSceneId,
      x: offsetX,
      y: offsetY,
      width: 245,
      characterId: 'sora',
      speaker: 'Sora',
      speakerColor: '#ff758c',
      dialogue: 'Un nuevo momento empieza aquí.\n¡Doble clic para editar!',
      portsOut: [{ id: 'out_cyan', color: 'cyan', yOffset: 150 }]
    });
  } else if (type === 'choice') {
    ctx.state.nodes.push({
      id,
      type: 'choice',
      title: 'Nodo: bifurcación de decisión',
      subtitle: 'Nodo de elección',
      showAddButtons: true,
      sceneId: defaultSceneId,
      x: offsetX,
      y: offsetY,
      width: 240,
      options: [
        { id: 'opt_1', label: 'Opción A: «Tomar el camino»', style: 'coral', inColor: 'cyan', outColor: 'coral' },
        { id: 'opt_2', label: 'Opción B: «Quedarse atrás»', style: 'teal', inColor: 'cyan', outColor: 'cyan' }
      ]
    });
  } else if (type === 'character_selector') {
    ctx.state.nodes.push({
      id,
      type: 'character_selector',
      title: 'Selector de personaje',
      sceneId: defaultSceneId,
      x: offsetX,
      y: offsetY,
      width: 230,
      selectedCharId: 'yuki',
      expression: 'Yuki - Alegre',
      scale: 100,
      position: 50,
      inColor: 'coral'
    });
  } else if (type === 'video_scene') {
    ctx.state.nodes.push({
      id,
      type: 'video_scene',
      badge: `Vídeo ${ctx.state.nodes.length + 1}`,
      sceneId: defaultSceneId,
      x: offsetX,
      y: offsetY,
      width: 250,
      dialogue: 'Se reproduce el vídeo y continúa…',
      videoAutoplay: true,
      videoLoop: false,
      videoMuted: false,
      videoControls: true,
      inColor: 'cyan'
    });
  } else if (type === 'sound_cue') {
    ctx.state.nodes.push({
      id,
      type: 'sound_cue',
      badge: '🔊 Sonido',
      sceneId: defaultSceneId,
      x: offsetX,
      y: offsetY,
      width: 240,
      dialogue: 'Complemento: suena y sigue sin bloquear.',
      volume: 100,
      loop: false,
      trigger: 'auto',
      inColor: 'cyan'
    });
  } else {
    ctx.state.nodes.push({
      id,
      type: 'branch_scene',
      headerBar: `Nodo ${ctx.state.nodes.length + 1}: Escena nueva`,
      sceneId: defaultSceneId,
      x: offsetX,
      y: offsetY,
      width: 250,
      characterId: 'aoi',
      speaker: 'Aoi',
      dialogue: 'Aoi: «¡Veamos a dónde lleva esto!»',
      inColor: 'cyan'
    });
  }

  ctx.selectedNodeId = id;
  renderNodes();
  showToast('Nodo nuevo añadido al lienzo');
}
