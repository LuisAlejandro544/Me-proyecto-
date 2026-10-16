// @ts-nocheck
// Playtest: animaciones de assets por nodo (extraído de ui/playtest.ts — barrel en ui/playtest.ts).
import { ctx } from '../../context';
import { assetAnimationsCss, resolveNodeAssetAnim } from '../../../asset-animations';
export function ensureAssetAnimStyleTag() {
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

export function restartCssAnimation(el: Element | null, classes: string) {
  if (!el) return;
  el.classList.remove('vn-asset-enter', 'vn-stage-trans');
  for (const c of [...el.classList]) {
    if (c.startsWith('vn-asset-enter-') || c.startsWith('vn-stage-trans-')) el.classList.remove(c);
  }
  // Reflow para reiniciar la animación de aparición/transición.
  void (el as HTMLElement).offsetWidth;
  for (const c of classes.split(' ').filter(Boolean)) el.classList.add(c);
}

export function applyAssetAnimations(node: { assetEnter?: string; assetMotion?: string; sceneTransition?: string; sceneId?: string; id?: string }) {
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
