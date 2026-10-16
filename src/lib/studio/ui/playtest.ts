// @ts-nocheck
// Motor de prueba: reproductor horizontal 16:9 con vídeo y sonido.
// Los nodos `video_scene` muestran <video> y los `sound_cue` / `audioAssetId`
// disparan <audio> al entrar en el paso.
import { ctx } from '../context';
import { playSynthSfx } from '../domain/audio';
import { escapeHtml } from '../domain/geometry';
import { showToast } from './toast';
import { findCustomAsset, resolveCharacter } from '../../assets';
import { getStartNodeId } from '../storage';
import { applyDialogueThemeToPlaytest } from './dialogue';
import { getSceneById, getSceneOfNode, resolveContinueSceneTarget, resolveSceneStartNode } from '../domain/scenes';
import { assetAnimationsCss, resolveNodeAssetAnim } from '../../asset-animations';

function stopPlaytestMedia() {
  try {
    const v = document.getElementById('vnVideoPlayer') as HTMLVideoElement | null;
    if (v) {
      v.pause();
      v.removeAttribute('src');
      v.load();
      v.classList.add('hidden');
    }
  } catch {}
  try {
    const a = document.getElementById('vnAudioPlayer') as HTMLAudioElement | null;
    if (a) {
      a.pause();
      a.removeAttribute('src');
      a.load();
    }
  } catch {}
  try {
    const img = document.getElementById('vnCharacterSprite') as HTMLImageElement | null;
    img?.classList.remove('hidden');
  } catch {}
}

async function tryLandscapeLock() {
  try {
    const hint = document.getElementById('vnRotateHint');
    const isPortraitPhone =
      window.matchMedia?.('(orientation: portrait)').matches && window.innerWidth < 640;
    if (hint) hint.classList.toggle('hidden', !isPortraitPhone);
  } catch {}
  try {
    const oo: any = screen.orientation as any;
    if (oo && typeof oo.lock === 'function' && document.fullscreenElement) {
      await oo.lock('landscape').catch(() => {});
    }
  } catch {}
}

export function startPlaytest() {
  playSynthSfx('click');
  __prevPlaySceneId = null;
  ensureAssetAnimStyleTag();
  const modal = document.getElementById('playtestModal');
  modal?.classList.remove('hidden');
  document.body.classList.add('vn-playing');
  tryLandscapeLock();
  wirePlaytestChrome();
  const startNode = ctx.state.nodes.find((n) => n.id === getStartNodeId()) ?? ctx.state.nodes[0];
  if (startNode) {
    renderPlaytestStep(startNode.id);
  } else {
    showToast('Añade al menos un nodo para probar');
  }
}

export function closePlaytest() {
  __prevPlaySceneId = null;
  stopPlaytestMedia();
  document.getElementById('playtestModal')?.classList.add('hidden');
  document.body.classList.remove('vn-playing');
  try {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } catch {}
  try {
    const oo: any = screen.orientation as any;
    if (oo && typeof oo.unlock === 'function') oo.unlock();
  } catch {}
}

function ensureAssetAnimStyleTag() {
  let tag = document.getElementById('vnAssetAnimCss');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'vnAssetAnimCss';
    tag.textContent = assetAnimationsCss();
    document.head.appendChild(tag);
  }
}

// Memoria de la escena anterior para detectar cambios de escenario.
let __prevPlaySceneId: string | null = null;

function restartCssAnimation(el: Element | null, classes: string) {
  if (!el) return;
  el.classList.remove('vn-asset-enter', 'vn-stage-trans');
  for (const c of [...el.classList]) {
    if (c.startsWith('vn-asset-enter-') || c.startsWith('vn-stage-trans-')) el.classList.remove(c);
  }
  // Reflow para reiniciar la animación de aparición/transición.
  void (el as HTMLElement).offsetWidth;
  for (const c of classes.split(' ').filter(Boolean)) el.classList.add(c);
}

function applyAssetAnimations(node: { assetEnter?: string; assetMotion?: string; sceneTransition?: string; sceneId?: string; id?: string }) {
  ensureAssetAnimStyleTag();
  const scene = (node.sceneId && getSceneById(ctx.state, node.sceneId)) || getSceneOfNode(ctx.state, node.id);
  const resolved = resolveNodeAssetAnim(node, ctx.state, scene?.id);
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const sceneChanged = __prevPlaySceneId !== null && __prevPlaySceneId !== (scene?.id ?? null);
  __prevPlaySceneId = (scene?.id ?? null);

  const spriteImg = document.getElementById('vnCharacterSprite');
  const videoEl = document.getElementById('vnVideoPlayer');
  const spriteWrap = document.getElementById('vnSpriteContainer');
  const stageBg = document.getElementById('vnStageBg');
  const card = document.getElementById('vnPlaytestCard');
  const dur = `${resolved.durationMs}ms`;
  for (const host of [spriteImg, videoEl, spriteWrap, stageBg, card]) {
    if (host) (host as HTMLElement).style.setProperty('--vn-anim-dur', dur);
  }

  // Movimiento continuo en el contenedor (persiste hasta el siguiente paso).
  if (spriteWrap) {
    for (const c of [...spriteWrap.classList]) {
      if (c.startsWith('vn-asset-motion-')) spriteWrap.classList.remove(c);
    }
    if (!reduceMotion && resolved.motion !== 'none') {
      spriteWrap.classList.add(`vn-asset-motion-${resolved.motion}`);
    }
  }

  if (reduceMotion) return;
  // Aparición del asset protagonista del paso.
  const mediaEl = node.type === 'video_scene' ? videoEl : spriteImg;
  if (mediaEl && resolved.enter !== 'none') {
    restartCssAnimation(mediaEl, `vn-asset-enter vn-asset-enter-${resolved.enter}`);
  }
  // Transición de escenario: solo cuando cambia la escena (o el nodo la fuerza),
  // para no marear en cada Continuar dentro de la misma escena.
  const nodeForces = !!(node.sceneTransition && node.sceneTransition !== 'none');
  if ((sceneChanged || nodeForces || __prevPlaySceneId === null) && resolved.transition !== 'none') {
    if (stageBg) restartCssAnimation(stageBg, `vn-stage-trans vn-stage-trans-${resolved.transition}`);
    else if (card) restartCssAnimation(card, `vn-stage-trans vn-stage-trans-${resolved.transition}`);
  }
}

export function resetPlaytestAnimMemory() {
  __prevPlaySceneId = null;
}

let __chromeWired = false;
function wirePlaytestChrome() {
  // El botón Salir lo recablea share.ts en modo invitado; aquí solo el resto.
  const fsBtn = document.getElementById('btnVnFullscreen');
  if (fsBtn && !(fsBtn as any).__wired) {
    (fsBtn as any).__wired = true;
    fsBtn.onclick = async () => {
      try {
        const card = document.getElementById('vnPlaytestCard') ?? document.getElementById('playtestModal');
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          await (card as any)?.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => (card as any)?.requestFullscreen?.());
        }
        await tryLandscapeLock();
      } catch {
        showToast('Tu navegador no permite pantalla completa aquí');
      }
    };
  }
  if (__chromeWired) return;
  __chromeWired = true;
  document.addEventListener('fullscreenchange', () => tryLandscapeLock());
}

function playAudioAsset(assetId: string | undefined, volumePct = 100, loop = false) {
  if (!assetId) return;
  const found = findCustomAsset(assetId);
  if (!found) return;
  const el = document.getElementById('vnAudioPlayer') as HTMLAudioElement | null;
  if (!el) return;
  try {
    el.pause();
    el.src = found.dataUrl;
    el.loop = !!loop;
    el.volume = Math.max(0, Math.min(1, (volumePct ?? 100) / 100));
    el.muted = !ctx.sfxEnabled ? false : false;
    el.play().catch(() => {});
  } catch {}
}

export function renderPlaytestStep(nodeId) {
  ctx.currentPlayNodeId = nodeId;
  const node = ctx.state.nodes.find(n => n.id === nodeId);
  if (!node) return;

  const scene = (node.sceneId && getSceneById(ctx.state, node.sceneId)) || getSceneOfNode(ctx.state, node.id);
  const scenePrefix = scene ? `🎬 ${scene.name} · ` : '';
  document.getElementById('vnCurrentNodeBadge').textContent =
    scenePrefix + (node.badge || node.headerBar || node.title || node.topTitle || node.id);

  // Check if there is a Character Selector node in the graph for scale/position
  const charSelector = ctx.state.nodes.find(n => n.type === 'character_selector');
  const scalePct = charSelector ? charSelector.scale : 100;
  const posPct = charSelector ? charSelector.position : 50;

  const spriteImg = document.getElementById('vnCharacterSprite');
  const spriteWrap = document.getElementById('vnSpriteContainer');
  const videoEl = document.getElementById('vnVideoPlayer') as HTMLVideoElement | null;
  const charObj = resolveCharacter(node.characterId || node.selectedCharId);

  stopPlaytestMedia();

  // ——— Vídeo: protagonista del paso ———
  if (node.type === 'video_scene') {
    const found = findCustomAsset(node.videoAssetId);
    spriteImg.classList.add('hidden');
    if (found && videoEl) {
      videoEl.classList.remove('hidden');
      videoEl.src = found.dataUrl;
      videoEl.loop = !!node.videoLoop;
      videoEl.muted = !!node.videoMuted;
      videoEl.controls = node.videoControls !== false;
      if (node.videoAutoplay !== false) videoEl.play().catch(() => {});
    }
    document.getElementById('vnSpeakerName').textContent = node.videoName || found?.name || 'Vídeo';
    document.getElementById('vnSpeakerName').style.color = '#e879f9';
    document.getElementById('vnExpressionTag').textContent =
      `${node.videoLoop ? '🔁 Bucle' : '▶ Una vez'}${node.videoMuted ? ' · 🔇' : ''}`;
  } else {
    spriteImg.classList.remove('hidden');
    spriteImg.src = node.type === 'banner_scene' ? charObj.banner : charObj.avatar;
  }
  // Posición en propiedad CSS independiente (`translate`): no pisa el
  // `transform` que animan las clases de movimiento. Tamaño por layout
  // (height explícito): nítido porque re-maqueta en vez de estirar el bitmap.
  // El tope descuenta la escala para no mostrar por encima de la intrínseca.
  const baseH = Math.min(window.innerHeight * 0.38, (480 * 100) / Math.max(scalePct, 1));
  spriteImg.style.height = `${Math.round((baseH * scalePct) / 100)}px`;
  spriteImg.style.width = 'auto';
  spriteWrap.style.transform = '';
  (spriteWrap as HTMLElement).style.translate = `${(posPct - 50) * 2.2}px 0`;
  try {
    applyAssetAnimations(node);
  } catch {}

  // ——— Sonido: complemento que suena al entrar ———
  if (node.type === 'sound_cue') {
    document.getElementById('vnSpeakerName').textContent = node.soundName || node.audioName || '🔊 Sonido';
    document.getElementById('vnSpeakerName').style.color = '#fbbf24';
    document.getElementById('vnExpressionTag').textContent = `Vol ${node.volume ?? 100}%${node.loop ? ' · 🔁' : ''}`;
    playAudioAsset(node.soundAssetId || node.audioAssetId, node.volume ?? 100, !!node.loop);
  } else if (node.audioAssetId) {
    playAudioAsset(node.audioAssetId, 100, false);
  }

  if (node.type !== 'video_scene' && node.type !== 'sound_cue') {
    document.getElementById('vnSpeakerName').textContent = node.speaker || charObj.name;
    document.getElementById('vnSpeakerName').style.color = node.speakerColor || charObj.color;
    document.getElementById('vnExpressionTag').textContent =
      `${charSelector?.expression || charObj.expressions[0]} • Escala ${scalePct}%`;
  }

  const dialogueEl = document.getElementById('vnDialogueText');
  if (node.type === 'choice') {
    dialogueEl.textContent = 'Elige tu próxima decisión:';
  } else if (node.type === 'character_selector') {
    dialogueEl.textContent = `¡${charObj.name} entra en escena (${node.expression})!`;
  } else if (node.type === 'video_scene') {
    dialogueEl.textContent = node.dialogue || 'Reproduciendo vídeo… pulsa Continuar para seguir.';
  } else if (node.type === 'sound_cue') {
    dialogueEl.textContent = node.dialogue || '🔊 Efecto sonoro (la historia continúa con Continuar).';
  } else {
    dialogueEl.textContent = node.dialogue || '…';
  }
  // Cuadro de diálogo personalizado: fondo importado + tipografía + animación de letras.
  try {
    applyDialogueThemeToPlaytest(node);
  } catch {}

  // Estilo del panel Editor de texto (tamaño/rotación/posición + transición).
  // Va DESPUÉS del tema: los valores explícitos del panel tienen prioridad.
  dialogueEl.style.fontSize = `${Math.round((node.dialogueSize ?? 16) * (node.textScale ?? 1))}px`;
  dialogueEl.style.transform = `rotate(${node.rotation ?? 0}deg) translateY(${node.textPosY ?? 0}px)`;
  dialogueEl.classList.remove('vn-dlg-t-fade', 'vn-dlg-t-slide');
  if (node.textTransition === 'fade' || node.textTransition === 'slide') {
    void dialogueEl.offsetWidth;
    dialogueEl.classList.add(node.textTransition === 'fade' ? 'vn-dlg-t-fade' : 'vn-dlg-t-slide');
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
      let targetNodeId = wire ? wire.toNode : null;
      // Salto directo a escena sin cable: la decisión lleva al inicio de esa escena.
      if (!targetNodeId && opt.gotoSceneId) {
        targetNodeId = resolveSceneStartNode(ctx.state, opt.gotoSceneId) || null;
      }
      // Sin cable ni escena: el nodo puede continuar hacia su `nextSceneId`.
      if (!targetNodeId && node.nextSceneId) {
        targetNodeId = resolveSceneStartNode(ctx.state, node.nextSceneId) || null;
      }
      const gotoName = !wire && opt.gotoSceneId ? (getSceneById(ctx.state, opt.gotoSceneId)?.name ?? '') : '';
      const btn = document.createElement('button');
      btn.className = 'w-full max-w-md px-5 py-3.5 rounded-2xl bg-[#1b2340]/95 hover:bg-cyan-500/25 border-2 border-cyan-400/50 text-sm sm:text-base font-semibold text-white shadow-2xl transition transform hover:scale-[1.02] flex items-center justify-between';
      btn.innerHTML = `
        <span>${escapeHtml(opt.label)}${gotoName ? ` <span class="text-[11px] text-amber-300 font-bold">→ 🎬 ${escapeHtml(gotoName)}</span>` : ''}</span>
        <span class="text-xs text-cyan-300 ml-2">→</span>
      `;
      btn.onclick = () => {
        playSynthSfx('choice');
        if (targetNodeId) {
          renderPlaytestStep(targetNodeId);
        } else {
          choicesOverlay.classList.add('hidden');
          dialogueEl.textContent = `[Elegido: ${opt.label}] — ¡Fin de esta rama! Conecta un cable de salida en el editor para continuar.`;
        }
      };
      choicesOverlay.appendChild(btn);
    });
  } else {
    choicesOverlay.classList.add('hidden');
    nextBtn.classList.remove('opacity-40', 'pointer-events-none');
    // Continuar: primero cables, luego salto de escena (fin de escena / nextSceneId).
    const sceneTarget = resolveContinueSceneTarget(ctx.state, node.id);
    const goTarget = outWires.length > 0 ? outWires[0].toNode : (sceneTarget || null);
    const goSceneName = !outWires.length && sceneTarget
      ? (getSceneOfNode(ctx.state, sceneTarget)?.name ?? '')
      : '';
    const nextLabel = nextBtn.querySelector('span') ?? nextBtn;
    nextLabel.textContent = goSceneName ? `Continuar → 🎬 ${goSceneName}` : 'Continuar';
    nextBtn.onclick = () => {
      playSynthSfx('click');
      if (goTarget) {
        renderPlaytestStep(goTarget);
      } else {
        showToast('¡Llegaste al final de esta rama de la historia!');
      }
    };
  }
}
