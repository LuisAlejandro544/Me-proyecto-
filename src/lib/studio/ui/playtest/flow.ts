// @ts-nocheck
// Playtest: flujo start/close/paso (extraído de ui/playtest.ts — barrel en ui/playtest.ts).
import { ctx } from '../../context';
import { playSynthSfx } from '../../domain/audio';
import { escapeHtml } from '../../domain/geometry';
import { showToast } from '../toast';
import { findCustomAsset, resolveCharacter } from '../../../assets';
import { getStartNodeId } from '../../storage';
import { applyDialogueThemeToPlaytest } from '../dialogue';
import { getSceneById, getSceneOfNode, resolveContinueSceneTarget, resolveSceneStartNode } from '../../domain/scenes';
import { stopPlaytestMedia, playAudioAsset, tryLandscapeLock } from './media';
import { applyAssetAnimations, ensureAssetAnimStyleTag, resetPlaytestAnimMemory } from './anim';
import { wirePlaytestChrome } from './chrome';
export function startPlaytest() {
  playSynthSfx('click');
  resetPlaytestAnimMemory();
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
  resetPlaytestAnimMemory();
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
  // Sin fallback a Sora: si el nodo no tiene personaje, no se muestra ninguno
  // (antes resolveCharacter caía a Sora y el "fondo" aparecía aunque no se hubiera puesto).
  const charObj = resolveCharacter(node.characterId || node.selectedCharId);

  stopPlaytestMedia();

  // ——— Vídeo: protagonista del paso ———
  if (node.type === 'video_scene') {
    const found = findCustomAsset(node.videoAssetId);
    spriteImg.classList.add('hidden');
    try { (spriteImg as HTMLImageElement).removeAttribute('src'); } catch {}
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
  } else if (!charObj) {
    // Sin personaje asignado: no mostrar ningún sprite (ni Sora de respaldo).
    // Limpia el src para que no quede la imagen del paso anterior.
    spriteImg.classList.add('hidden');
    try { (spriteImg as HTMLImageElement).removeAttribute('src'); } catch {}
    spriteImg.style.height = '0px';
  } else {
    spriteImg.classList.remove('hidden');
    (spriteImg as HTMLImageElement).src = node.type === 'banner_scene' ? charObj.banner : charObj.avatar;
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
    document.getElementById('vnSpeakerName').textContent = node.speaker || charObj?.name || 'Narrador';
    document.getElementById('vnSpeakerName').style.color = node.speakerColor || charObj?.color || '#94a3b8';
    const expr = charSelector?.expression || charObj?.expressions?.[0] || 'Sin personaje';
    document.getElementById('vnExpressionTag').textContent = `${expr} • Escala ${scalePct}%`;
  }

  const dialogueEl = document.getElementById('vnDialogueText');
  // Limpia el temporizador de espera del paso anterior (nodo wait).
  try { if (globalThis.__vnWaitTimer) { clearTimeout(globalThis.__vnWaitTimer); globalThis.__vnWaitTimer = null; } } catch {}
  // Limpia el estilo de monólogo/narración del paso anterior.
  dialogueEl.style.fontStyle = '';
  dialogueEl.style.textAlign = '';
  if (node.type === 'choice') {
    dialogueEl.textContent = 'Elige tu próxima decisión:';
  } else if (node.type === 'character_selector') {
    dialogueEl.textContent = `¡${charObj.name} entra en escena (${node.expression})!`;
  } else if (node.type === 'video_scene') {
    dialogueEl.textContent = node.dialogue || 'Reproduciendo vídeo… pulsa Continuar para seguir.';
  } else if (node.type === 'sound_cue') {
    dialogueEl.textContent = node.dialogue || '🔊 Efecto sonoro (la historia continúa con Continuar).';
  } else if (node.type === 'jump') {
    dialogueEl.textContent = node.dialogue || '↗️ Salto a otra parte de la historia…';
  } else if (node.type === 'ending') {
    dialogueEl.textContent = `${node.endingTitle || node.title || 'Final'}\n${node.dialogue || ''}`.trim();
  } else if (node.type === 'background') {
    dialogueEl.textContent = node.dialogue || '🖼️ Cambia el fondo…';
  } else if (node.type === 'narration') {
    dialogueEl.textContent = node.dialogue || '…';
  } else if (node.type === 'monologue') {
    dialogueEl.textContent = node.dialogue || '…';
  } else if (node.type === 'wait') {
    dialogueEl.textContent = `${node.dialogue || '…'}\n⏳ ${Number(node.waitMs ?? 800)} ms…`;
  } else if (node.type === 'effect') {
    dialogueEl.textContent = node.dialogue || '✨ Efecto…';
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

  // ——— Nodos nuevos: fondo persistente, estilos y efectos ———
  try {
    if (node.type === 'background' && node.backgroundAssetId) {
      const bg = findCustomAsset(node.backgroundAssetId);
      const stage = document.getElementById('vnStageBg');
      if (bg?.dataUrl && stage) {
        stage.style.backgroundImage = `url("${bg.dataUrl}")`;
        stage.style.backgroundSize = 'cover';
        stage.style.backgroundPosition = 'center';
      }
    }
    // Narración con fondo opcional: solo se muestra en este paso (no persiste).
    if (node.type === 'narration' && node.backgroundAssetId) {
      const bg = findCustomAsset(node.backgroundAssetId);
      const stage = document.getElementById('vnStageBg');
      if (bg?.dataUrl && stage) {
        stage.style.backgroundImage = `url("${bg.dataUrl}")`;
        stage.style.backgroundSize = 'cover';
        stage.style.backgroundPosition = 'center';
      }
    }
    if (node.type === 'narration') {
      document.getElementById('vnSpeakerName').textContent = '📖 Narración';
      document.getElementById('vnSpeakerName').style.color = '#cbd5e1';
      document.getElementById('vnExpressionTag').textContent = 'Pantalla completa';
      dialogueEl.style.textAlign = 'center';
    } else if (node.type === 'monologue') {
      document.getElementById('vnSpeakerName').textContent = `💭 ${node.speaker || charObj?.name || 'Pensamiento'}`;
      document.getElementById('vnSpeakerName').style.color = node.speakerColor || '#a78bfa';
      document.getElementById('vnExpressionTag').textContent = 'Monólogo interno';
      dialogueEl.style.fontStyle = 'italic';
    } else if (node.type === 'ending') {
      const kindLabel = { bueno: '🌅 Final bueno', malo: '🌑 Final malo', secreto: '🗝 Final secreto', neutral: '🌫 Final neutral' }[node.endingKind] || '🏁 Final';
      document.getElementById('vnSpeakerName').textContent = kindLabel;
      document.getElementById('vnSpeakerName').style.color = '#6ee7b7';
      document.getElementById('vnExpressionTag').textContent = node.endingTitle || node.title || 'Fin de la historia';
      dialogueEl.style.textAlign = 'center';
    } else if (node.type === 'jump') {
      const destName = (() => {
        if (node.jumpNodeId) {
          const t = ctx.state.nodes.find((n) => n.id === node.jumpNodeId);
          return t ? (t.badge || t.title || t.headerBar || t.id) : node.jumpNodeId;
        }
        if (node.jumpSceneId) return getSceneById(ctx.state, node.jumpSceneId)?.name ?? node.jumpSceneId;
        return 'sin destino';
      })();
      document.getElementById('vnSpeakerName').textContent = '↗️ Salto';
      document.getElementById('vnSpeakerName').style.color = '#7dd3fc';
      document.getElementById('vnExpressionTag').textContent = `→ ${destName}`;
    } else if (node.type === 'wait') {
      document.getElementById('vnSpeakerName').textContent = '⏳ Pausa';
      document.getElementById('vnSpeakerName').style.color = '#fde68a';
      document.getElementById('vnExpressionTag').textContent = `${Number(node.waitMs ?? 800)} ms`;
    } else if (node.type === 'effect') {
      const kindLabel = { flash: '⚡ Flash', 'fade-black': '⬛ Fundido', shake: '📳 Sacudida', 'zoom-punch': '👊 Zoom', hearts: '💖 Corazones', rain: '🌧 Lluvia', snow: '❄ Nieve', sparkles: '✨ Chispas' }[node.effectKind] || '✨ Efecto';
      document.getElementById('vnSpeakerName').textContent = kindLabel;
      document.getElementById('vnSpeakerName').style.color = '#f9a8d4';
      document.getElementById('vnExpressionTag').textContent = `${Number(node.effectDurationMs ?? 600)} ms`;
      playVisualEffect(node.effectKind || 'shake', Number(node.effectDurationMs ?? 600));
    }
  } catch {}
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
    // Continuar: cables → salto del nodo jump → salto de escena (fin / nextSceneId).
    const sceneTarget = resolveContinueSceneTarget(ctx.state, node.id);
    let jumpTarget = null;
    if (node.type === 'jump') {
      if (node.jumpNodeId && ctx.state.nodes.some((n) => n.id === node.jumpNodeId)) {
        jumpTarget = node.jumpNodeId;
      } else if (node.jumpSceneId) {
        jumpTarget = resolveSceneStartNode(ctx.state, node.jumpSceneId) || null;
      }
    }
    const goTarget = outWires.length > 0 ? outWires[0].toNode : (jumpTarget || sceneTarget || null);
    // El final es terminal: no hay Continuar, se muestra el epílogo como cierre.
    if (node.type === 'ending') {
      nextBtn.classList.add('opacity-40', 'pointer-events-none');
      const nextLabel = nextBtn.querySelector('span') ?? nextBtn;
      nextLabel.textContent = '🏁 Fin';
      nextBtn.onclick = () => showToast('🏁 Este es un final de la historia. ¡Gracias por jugar!');
      showToast(`🏁 ${node.endingTitle || 'Final'} — pulsa Reiniciar para volver a jugar`);
      return;
    }
    const goSceneName = !outWires.length && sceneTarget
      ? (getSceneOfNode(ctx.state, sceneTarget)?.name ?? '')
      : '';
    const jumpName = !outWires.length && jumpTarget && node.type === 'jump'
      ? (getSceneOfNode(ctx.state, jumpTarget)?.name ?? '')
      : '';
    const nextLabel = nextBtn.querySelector('span') ?? nextBtn;
    if (node.type === 'jump') {
      nextLabel.textContent = jumpName ? `Saltar → 🎬 ${jumpName}` : 'Saltar →';
    } else {
      nextLabel.textContent = goSceneName ? `Continuar → 🎬 ${goSceneName}` : 'Continuar';
    }
    // La pausa avanza sola tras waitMs (con botón para omitirla).
    if (node.type === 'wait' && goTarget) {
      const ms = Math.max(200, Math.min(5000, Number(node.waitMs ?? 800)));
      nextLabel.textContent = `Omitir espera (${ms} ms) →`;
      try { if (globalThis.__vnWaitTimer) clearTimeout(globalThis.__vnWaitTimer); } catch {}
      try {
        globalThis.__vnWaitTimer = setTimeout(() => {
          globalThis.__vnWaitTimer = null;
          try { renderPlaytestStep(goTarget); } catch {}
        }, ms);
      } catch {}
      nextBtn.onclick = () => {
        playSynthSfx('click');
        try { if (globalThis.__vnWaitTimer) { clearTimeout(globalThis.__vnWaitTimer); globalThis.__vnWaitTimer = null; } } catch {}
        renderPlaytestStep(goTarget);
      };
      return;
    }
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

/** Efecto visual breve sobre la tarjeta de playtest (flash / shake / partículas). */
export function playVisualEffect(kind: string, durationMs: number) {
  try {
    const card = document.getElementById('vnPlaytestCard');
    if (!card) return;
    const ms = Math.max(200, Math.min(3000, Number(durationMs) || 600));
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    if (kind === 'flash' || kind === 'fade-black') {
      const overlay = document.createElement('div');
      overlay.style.cssText = `position:absolute;inset:0;z-index:40;pointer-events:none;background:${kind === 'flash' ? '#fff' : '#000'};opacity:0;transition:opacity 180ms;`;
      card.appendChild(overlay);
      requestAnimationFrame(() => { overlay.style.opacity = '0.9'; });
      setTimeout(() => { overlay.style.opacity = '0'; }, Math.max(120, ms - 220));
      setTimeout(() => { try { overlay.remove(); } catch {} }, ms);
    } else if (kind === 'shake' || kind === 'zoom-punch') {
      const dx = kind === 'shake' ? 10 : 0;
      card.animate(
        kind === 'shake'
          ? [{ transform: 'translateX(0)' }, { transform: `translateX(${-dx}px)` }, { transform: `translateX(${dx}px)` }, { transform: `translateX(${-dx / 2}px)` }, { transform: 'translateX(0)' }]
          : [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
        { duration: Math.min(ms, 800), iterations: kind === 'shake' ? 2 : 1 }
      );
    } else {
      const emoji = kind === 'hearts' ? '💖' : kind === 'rain' ? '🌧' : kind === 'snow' ? '❄' : '✨';
      const layer = document.createElement('div');
      layer.style.cssText = 'position:absolute;inset:0;z-index:40;pointer-events:none;overflow:hidden;display:flex;justify-content:space-around;font-size:28px;';
      for (let i = 0; i < 12; i++) {
        const s = document.createElement('span');
        s.textContent = emoji;
        s.style.cssText = `transform:translateY(-40px);opacity:0.95;animation-delay:${(i * 90) + Math.random() * 200}ms;`;
        layer.appendChild(s);
      }
      card.appendChild(layer);
      try {
        layer.animate([{ transform: 'translateY(-30px)', opacity: 0 }, { transform: 'translateY(120px)', opacity: 1 }], { duration: ms, easing: 'ease-in' });
      } catch {}
      setTimeout(() => { try { layer.remove(); } catch {} }, ms + 60);
    }
  } catch {}
}
