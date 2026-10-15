// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { CHARACTER_ASSETS } from '../data/assets';
import { playSynthSfx } from '../domain/audio';
import { escapeHtml } from '../domain/geometry';
import { showToast } from './toast';

export function startPlaytest() {
  playSynthSfx('click');
  const modal = document.getElementById('playtestModal');
  modal.classList.remove('hidden');
  const startNode = ctx.state.nodes[0];
  if (startNode) {
    renderPlaytestStep(startNode.id);
  }
}
export function renderPlaytestStep(nodeId) {
  ctx.currentPlayNodeId = nodeId;
  const node = ctx.state.nodes.find(n => n.id === nodeId);
  if (!node) return;

  document.getElementById('vnCurrentNodeBadge').textContent =
    node.badge || node.headerBar || node.title || node.topTitle || node.id;

  // Check if there is a Character Selector node in the graph for scale/position
  const charSelector = ctx.state.nodes.find(n => n.type === 'character_selector');
  const scalePct = charSelector ? charSelector.scale : 100;
  const posPct = charSelector ? charSelector.position : 50;

  const spriteImg = document.getElementById('vnCharacterSprite');
  const spriteWrap = document.getElementById('vnSpriteContainer');
  const charKey = node.characterId || node.selectedCharId || 'sora';
  const charObj = CHARACTER_ASSETS[charKey] || CHARACTER_ASSETS.sora;

  spriteImg.src = node.type === 'banner_scene' ? charObj.banner : charObj.avatar;
  spriteWrap.style.transform = `translateX(${(posPct - 50) * 2.2}px) scale(${scalePct / 100})`;

  document.getElementById('vnSpeakerName').textContent = node.speaker || charObj.name;
  document.getElementById('vnSpeakerName').style.color = node.speakerColor || charObj.color;
  document.getElementById('vnExpressionTag').textContent =
    `${charSelector?.expression || charObj.expressions[0]} • Scale ${scalePct}%`;

  const dialogueEl = document.getElementById('vnDialogueText');
  if (node.type === 'choice') {
    dialogueEl.textContent = 'Select your next decision:';
  } else if (node.type === 'character_selector') {
    dialogueEl.textContent = `${charObj.name} enters the scene (${node.expression})!`;
  } else {
    dialogueEl.textContent = node.dialogue || '...';
  }

  // Render story variables readout
  const varsEl = document.getElementById('vnVariablesReadout');
  varsEl.innerHTML = Object.entries(ctx.state.variables || {})
    .map(([k, v]) => `<span class="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">${escapeHtml(k)}: ${escapeHtml(String(v))}</span>`)
    .join('');

  // Check outgoing connections
  const outWires = ctx.state.wires.filter(w => w.fromNode === node.id);
  const choicesOverlay = document.getElementById('vnChoicesOverlay');
  const nextBtn = document.getElementById('btnVnNext');

  // If this node is a choice node, show interactive choice buttons
  if (node.type === 'choice' && node.options?.length) {
    choicesOverlay.innerHTML = '';
    choicesOverlay.classList.remove('hidden');
    nextBtn.classList.add('opacity-40', 'pointer-events-none');

    node.options.forEach(opt => {
      const wire = outWires.find(w => w.fromPort === `out_${opt.id}`);
      const targetNodeId = wire ? wire.toNode : null;
      const btn = document.createElement('button');
      btn.className = 'w-full max-w-md px-5 py-3.5 rounded-2xl bg-[#1b2340]/95 hover:bg-cyan-500/25 border-2 border-cyan-400/50 text-sm sm:text-base font-semibold text-white shadow-2xl transition transform hover:scale-[1.02] flex items-center justify-between';
      btn.innerHTML = `
        <span>${escapeHtml(opt.label)}</span>
        <span class="text-xs text-cyan-300 ml-2">→</span>
      `;
      btn.onclick = () => {
        playSynthSfx('choice');
        if (targetNodeId) {
          renderPlaytestStep(targetNodeId);
        } else {
          choicesOverlay.classList.add('hidden');
          dialogueEl.textContent = `[Chosen: ${opt.label}] — End of this branch! Connect an output wire in the editor to continue.`;
        }
      };
      choicesOverlay.appendChild(btn);
    });
  } else {
    choicesOverlay.classList.add('hidden');
    nextBtn.classList.remove('opacity-40', 'pointer-events-none');
    nextBtn.onclick = () => {
      playSynthSfx('click');
      if (outWires.length > 0) {
        renderPlaytestStep(outWires[0].toNode);
      } else {
        showToast('Reached the end of this story branch!');
      }
    };
  }
}
