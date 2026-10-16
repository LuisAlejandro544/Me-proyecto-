// Animaciones de assets y escenarios: aparición, modos (movimiento en bucle)
// y transiciones entre escenarios/nodos.
// - Por nodo: `assetEnter` (cómo entra el sprite/vídeo), `assetMotion` (modo
//   continuo: flotar, latir…), `sceneTransition` (transición al llegar al nodo).
// - Por escena: `enterTransition` (al entrar en la escena).
// - Proyecto (VNState): `defaultAssetEnter` / `defaultAssetMotion` /
//   `defaultSceneTransition` + `animDurationMs` (velocidad global).
// Todo se aplica en Probar, modo invitado y .html compilado (ver compile.ts),
// con respeto a `prefers-reduced-motion`.

export type AssetEnterAnimation =
  | 'none'
  | 'fade-in'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'zoom-in'
  | 'bounce-in'
  | 'blur-in'
  | 'flip-in';

export type AssetMotion =
  | 'none'
  | 'float'
  | 'sway'
  | 'bob'
  | 'pulse'
  | 'breathe'
  | 'shake-soft'
  | 'spin-slow';

export type SceneTransition =
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'zoom'
  | 'blur'
  | 'wipe';

export interface AssetAnimationOption {
  id: string;
  label: string;
  desc: string;
}

export const ASSET_ENTER_ANIMATIONS: AssetAnimationOption[] = [
  { id: 'none', label: 'Sin aparición', desc: 'El sprite aparece al instante.' },
  { id: 'fade-in', label: '✨ Fundido', desc: 'Aparece con un fundido suave.' },
  { id: 'slide-left', label: '⬅️ Desde la derecha', desc: 'Entra deslizándose desde la derecha.' },
  { id: 'slide-right', label: '➡️ Desde la izquierda', desc: 'Entra deslizándose desde la izquierda.' },
  { id: 'slide-up', label: '⬆️ Desde abajo', desc: 'Entra subiendo desde abajo.' },
  { id: 'zoom-in', label: '🔍 Zoom de entrada', desc: 'Crece desde pequeño hasta su tamaño.' },
  { id: 'bounce-in', label: '⚽ Rebote', desc: 'Entra con un pequeño rebote.' },
  { id: 'blur-in', label: '🌫️ Enfoque', desc: 'De borroso a nítido.' },
  { id: 'flip-in', label: '🔄 Volteo', desc: 'Gira al aparecer (efecto carta).' }
];

export const ASSET_MOTIONS: AssetAnimationOption[] = [
  { id: 'none', label: 'Quieto', desc: 'Sin movimiento continuo.' },
  { id: 'float', label: '🎈 Flotar', desc: 'Flota arriba/abajo en bucle.' },
  { id: 'sway', label: '🌊 Balanceo', desc: 'Se mece de lado a lado.' },
  { id: 'bob', label: '🐇 Saltitos', desc: 'Pequeños saltos continuos.' },
  { id: 'pulse', label: '💓 Pulso', desc: 'Late suavemente (escala).' },
  { id: 'breathe', label: '🫁 Respirar', desc: 'Respiración lenta y sutil.' },
  { id: 'shake-soft', label: '📳 Temblor suave', desc: 'Vibra levemente (nervios, miedo).' },
  { id: 'spin-slow', label: '🌀 Giro lento', desc: 'Rotación completa muy lenta.' }
];

export const SCENE_TRANSITIONS: AssetAnimationOption[] = [
  { id: 'none', label: 'Corte seco', desc: 'Sin transición: cambio instantáneo.' },
  { id: 'fade', label: '✨ Fundido', desc: 'El escenario se funde al cambiar.' },
  { id: 'slide-left', label: '⬅️ Deslizar izq.', desc: 'La escena entra desde la derecha.' },
  { id: 'slide-right', label: '➡️ Deslizar der.', desc: 'La escena entra desde la izquierda.' },
  { id: 'slide-up', label: '⬆️ Subir', desc: 'La escena sube desde abajo.' },
  { id: 'zoom', label: '🔍 Zoom', desc: 'Apertura con zoom suave.' },
  { id: 'blur', label: '🌫️ Desenfoque', desc: 'Funde con desenfoque cinematográfico.' },
  { id: 'wipe', label: '🧹 Barrido', desc: 'Barrido lateral con clip-path.' }
];

export function assetEnterLabelOf(id?: string | null): string {
  if (!id) return '— La global —';
  return ASSET_ENTER_ANIMATIONS.find((a) => a.id === id)?.label ?? id;
}

export function assetMotionLabelOf(id?: string | null): string {
  if (!id) return '— El global —';
  return ASSET_MOTIONS.find((a) => a.id === id)?.label ?? id;
}

export function sceneTransitionLabelOf(id?: string | null): string {
  if (!id) return '— La global —';
  return SCENE_TRANSITIONS.find((a) => a.id === id)?.label ?? id;
}

export interface ResolvedAssetAnim {
  enter: AssetEnterAnimation;
  motion: AssetMotion;
  transition: SceneTransition;
  durationMs: number;
}

/** Valores globales del proyecto (VNState) con fallbacks sensatos. */
export function getProjectAssetDefaults(state?: {
  defaultAssetEnter?: string;
  defaultAssetMotion?: string;
  defaultSceneTransition?: string;
  animDurationMs?: number;
} | null): { enter: AssetEnterAnimation; motion: AssetMotion; transition: SceneTransition; durationMs: number } {
  const enter = (state?.defaultAssetEnter as AssetEnterAnimation) || 'fade-in';
  const motion = (state?.defaultAssetMotion as AssetMotion) || 'none';
  const transition = (state?.defaultSceneTransition as SceneTransition) || 'fade';
  const raw = Number(state?.animDurationMs);
  const durationMs = Number.isFinite(raw) ? Math.max(120, Math.min(2000, raw)) : 450;
  return {
    enter: ASSET_ENTER_ANIMATIONS.some((a) => a.id === enter) ? enter : 'fade-in',
    motion: ASSET_MOTIONS.some((a) => a.id === motion) ? motion : 'none',
    transition: SCENE_TRANSITIONS.some((a) => a.id === transition) ? transition : 'fade',
    durationMs
  };
}

/**
 * Animación efectiva de un nodo:
 * 1) override del nodo → 2) transición de su escena (`enterTransition`) para
 *    el cambio de escenario → 3) valores globales del proyecto.
 */
export function resolveNodeAssetAnim(
  node: { assetEnter?: string; assetMotion?: string; sceneTransition?: string } | undefined | null,
  state?: {
    defaultAssetEnter?: string;
    defaultAssetMotion?: string;
    defaultSceneTransition?: string;
    animDurationMs?: number;
    scenes?: { id: string; enterTransition?: string }[];
    [k: string]: unknown;
  } | null,
  sceneId?: string | null
): ResolvedAssetAnim {
  const defaults = getProjectAssetDefaults(state);
  const scene = (state?.scenes as { id: string; enterTransition?: string }[] | undefined)?.find(
    (s) => s.id === (sceneId ?? (node as { sceneId?: string } | null)?.sceneId)
  );
  const sceneT = (scene?.enterTransition as SceneTransition) || undefined;
  const nodeT = (node?.sceneTransition as SceneTransition) || undefined;
  const transition = nodeT && nodeT !== ('global' as unknown as SceneTransition)
    ? nodeT
    : sceneT ?? defaults.transition;
  return {
    enter: ((node?.assetEnter as AssetEnterAnimation) || defaults.enter) as AssetEnterAnimation,
    motion: ((node?.assetMotion as AssetMotion) || defaults.motion) as AssetMotion,
    transition: (transition || 'fade') as SceneTransition,
    durationMs: defaults.durationMs
  };
}

/** CSS compartido (playtest + .html compilado + editor). `prefix` para scoping. */
export function assetAnimationsCss(prefix = ''): string {
  const p = prefix ? `${prefix} ` : '';
  return `
${p}.vn-asset-enter { animation-duration: var(--vn-anim-dur, 450ms); animation-timing-function: cubic-bezier(0.22,1,0.36,1); animation-fill-mode: both; }
${p}.vn-asset-enter-fade-in { animation-name: vn-asset-fade-in; }
${p}.vn-asset-enter-slide-left { animation-name: vn-asset-slide-left; }
${p}.vn-asset-enter-slide-right { animation-name: vn-asset-slide-right; }
${p}.vn-asset-enter-slide-up { animation-name: vn-asset-slide-up; }
${p}.vn-asset-enter-zoom-in { animation-name: vn-asset-zoom-in; }
${p}.vn-asset-enter-bounce-in { animation-name: vn-asset-bounce-in; }
${p}.vn-asset-enter-blur-in { animation-name: vn-asset-blur-in; }
${p}.vn-asset-enter-flip-in { animation-name: vn-asset-flip-in; }
@keyframes vn-asset-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes vn-asset-slide-left { from { opacity: 0; transform: translateX(64px); } to { opacity: 1; transform: translateX(0); } }
@keyframes vn-asset-slide-right { from { opacity: 0; transform: translateX(-64px); } to { opacity: 1; transform: translateX(0); } }
@keyframes vn-asset-slide-up { from { opacity: 0; transform: translateY(48px); } to { opacity: 1; transform: translateY(0); } }
@keyframes vn-asset-zoom-in { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
@keyframes vn-asset-bounce-in { 0% { opacity: 0; transform: scale(0.6) translateY(24px); } 60% { opacity: 1; transform: scale(1.06) translateY(-6px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes vn-asset-blur-in { from { opacity: 0; filter: blur(10px); transform: scale(1.04); } to { opacity: 1; filter: blur(0); transform: scale(1); } }
@keyframes vn-asset-flip-in { from { opacity: 0; transform: perspective(600px) rotateY(80deg); } to { opacity: 1; transform: perspective(600px) rotateY(0); } }
${p}.vn-asset-motion-float { animation: vn-motion-float 3.2s ease-in-out infinite; }
${p}.vn-asset-motion-sway { animation: vn-motion-sway 3.8s ease-in-out infinite; transform-origin: 50% 90%; }
${p}.vn-asset-motion-bob { animation: vn-motion-bob 1.1s ease-in-out infinite; }
${p}.vn-asset-motion-pulse { animation: vn-motion-pulse 1.8s ease-in-out infinite; }
${p}.vn-asset-motion-breathe { animation: vn-motion-breathe 4s ease-in-out infinite; }
${p}.vn-asset-motion-shake-soft { animation: vn-motion-shake 0.6s ease-in-out infinite; }
${p}.vn-asset-motion-spin-slow { animation: vn-motion-spin 14s linear infinite; }
@keyframes vn-motion-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes vn-motion-sway { 0%,100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
@keyframes vn-motion-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes vn-motion-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes vn-motion-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.025); } }
@keyframes vn-motion-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-2px) rotate(-0.4deg); } 75% { transform: translateX(2px) rotate(0.4deg); } }
@keyframes vn-motion-spin { to { transform: rotate(360deg); } }
${p}.vn-stage-trans { animation-duration: var(--vn-anim-dur, 450ms); animation-timing-function: ease; animation-fill-mode: both; }
${p}.vn-stage-trans-fade { animation-name: vn-stage-fade; }
${p}.vn-stage-trans-slide-left { animation-name: vn-stage-slide-left; }
${p}.vn-stage-trans-slide-right { animation-name: vn-stage-slide-right; }
${p}.vn-stage-trans-slide-up { animation-name: vn-stage-slide-up; }
${p}.vn-stage-trans-zoom { animation-name: vn-stage-zoom; }
${p}.vn-stage-trans-blur { animation-name: vn-stage-blur; }
${p}.vn-stage-trans-wipe { animation-name: vn-stage-wipe; }
@keyframes vn-stage-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes vn-stage-slide-left { from { opacity: 0; transform: translateX(72px); } to { opacity: 1; transform: translateX(0); } }
@keyframes vn-stage-slide-right { from { opacity: 0; transform: translateX(-72px); } to { opacity: 1; transform: translateX(0); } }
@keyframes vn-stage-slide-up { from { opacity: 0; transform: translateY(56px); } to { opacity: 1; transform: translateY(0); } }
@keyframes vn-stage-zoom { from { opacity: 0; transform: scale(1.08); } to { opacity: 1; transform: scale(1); } }
@keyframes vn-stage-blur { from { opacity: 0; filter: blur(12px); } to { opacity: 1; filter: blur(0); } }
@keyframes vn-stage-wipe { from { opacity: 1; clip-path: inset(0 100% 0 0); } to { opacity: 1; clip-path: inset(0 0 0 0); } }
@media (prefers-reduced-motion: reduce) {
${p}.vn-asset-enter, ${p}.vn-stage-trans { animation: none !important; }
${p}[class*="vn-asset-motion-"] { animation: none !important; }
}`;
}
