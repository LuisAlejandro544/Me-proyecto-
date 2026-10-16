import { showToast } from '../toast';
import { tryLandscapeLock } from './media';
// @ts-nocheck
// Playtest: cableado del modal (extraído de ui/playtest.ts — barrel en ui/playtest.ts).
import { ctx } from '../../context';
import { getStartNodeId } from '../../storage';
let __chromeWired = false;
export function wirePlaytestChrome() {
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

