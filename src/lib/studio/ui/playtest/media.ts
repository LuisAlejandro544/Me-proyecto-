// @ts-nocheck
// Playtest: audio y vídeo del paso (extraído de ui/playtest.ts — barrel en ui/playtest.ts).
import { ctx } from '../../context';
import { findCustomAsset } from '../../../assets';
export function stopPlaytestMedia() {
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

export async function tryLandscapeLock() {
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

export function playAudioAsset(assetId: string | undefined, volumePct = 100, loop = false) {
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

