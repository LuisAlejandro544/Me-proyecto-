// @ts-nocheck
// Render de nodos — orquestador (tarjetas partidas en ui/cards/*.ts).
// Choice/Compact se montan como Svelte; el resto delega en su tarjeta.
import { ctx } from '../context';
import { attachNodeInteractions } from './interactions';
import { renderWires } from './render-wires';
import { mount, unmount } from 'svelte';
import ChoiceNodeCard from '../../../components/nodes/ChoiceNodeCard.svelte';
import CompactSceneCard from '../../../components/nodes/CompactSceneCard.svelte';
import { applyTextStyle, buildToolbar } from './cards/toolbar';
import { renderBannerCard } from './cards/banner';
import { renderSelectorCard } from './cards/selector';
import { renderAvatarCard } from './cards/avatar';
import { renderBranchCard } from './cards/branch';
import { renderVideoCard } from './cards/video';
import { renderSoundCard } from './cards/sound';
import { renderJumpCard, renderEndingCard, renderBackgroundCard, renderNarrationCard, renderMonologueCard, renderWaitCard, renderEffectCard } from './cards/system';

let mountedCards: object[] = [];

export function renderNodes() {
  const layer = document.getElementById('nodesLayer');
  for (const app of mountedCards) {
    try { unmount(app); } catch {}
  }
  mountedCards = [];
  layer.innerHTML = '';

  ctx.state.nodes.forEach(node => {
    const el = document.createElement('div');
    const isStart = (ctx.state as { startNodeId?: string }).startNodeId === node.id;
    el.className = `vn-node ${node.type === 'choice' ? 'vn-node-choice' : ''} ${ctx.selectedNodeId === node.id ? 'selected' : ''} ${isStart ? 'vn-start-node' : ''}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.style.width = `${node.width || 240}px`;
    el.dataset.nodeId = node.id;
    applyTextStyle(el, node);
    const toolbar = buildToolbar(node, isStart);

    if (node.type === 'banner_scene') el.innerHTML = renderBannerCard(node);
    else if (node.type === 'choice') mountedCards.push(mount(ChoiceNodeCard, { target: el, props: { node } }));
    else if (node.type === 'compact_scene') mountedCards.push(mount(CompactSceneCard, { target: el, props: { node } }));
    else if (node.type === 'character_selector') el.innerHTML = renderSelectorCard(node);
    else if (node.type === 'avatar_scene') el.innerHTML = renderAvatarCard(node);
    else if (node.type === 'branch_scene') el.innerHTML = renderBranchCard(node);
    else if (node.type === 'video_scene') el.innerHTML = renderVideoCard(node);
    else if (node.type === 'sound_cue') el.innerHTML = renderSoundCard(node);
    else if (node.type === 'jump') el.innerHTML = renderJumpCard(node);
    else if (node.type === 'ending') el.innerHTML = renderEndingCard(node);
    else if (node.type === 'background') el.innerHTML = renderBackgroundCard(node);
    else if (node.type === 'narration') el.innerHTML = renderNarrationCard(node);
    else if (node.type === 'monologue') el.innerHTML = renderMonologueCard(node);
    else if (node.type === 'wait') el.innerHTML = renderWaitCard(node);
    else if (node.type === 'effect') el.innerHTML = renderEffectCard(node);

    el.insertAdjacentHTML('afterbegin', toolbar);
    layer.appendChild(el);
  });

  attachNodeInteractions();
  requestAnimationFrame(() => renderWires());
}
