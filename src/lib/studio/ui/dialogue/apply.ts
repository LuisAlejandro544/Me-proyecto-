// @ts-nocheck
// Diálogos: aplicación del tema en playtest (extraído de ui/dialogue.ts — barrel en ui/dialogue.ts).
import { ctx } from '../../context';
import { fontStackOf, getDialogueTheme, getProjectDialogueThemeId } from '../../../dialogue-themes';
import { ensureAnimStyleTag } from './io';

/** Aplica el tema resuelto al modal de prueba (caja + fuentes + animación letra a letra). */
export function applyDialogueThemeToPlaytest(node) {
  ensureAnimStyleTag();
  const projectId = getProjectDialogueThemeId(ctx.state);
  const theme = getDialogueTheme(
    node?.dlgThemeId && node.dlgThemeId !== 'global' ? node.dlgThemeId : projectId
  );
  const merged = { ...theme };
  if (node?.dlgFont) merged.font = node.dlgFont;
  if (node?.dlgAnimation) merged.animation = node.dlgAnimation;
  if (typeof node?.dlgFontSize === 'number' && node.dlgFontSize > 0) merged.fontSize = node.dlgFontSize;
  if (node?.dlgFontColor) merged.fontColor = node.dlgFontColor;

  const box = (document.getElementById('vnDialogueBox') as HTMLElement | null)
    ?? document.querySelector('#playtestModal [id="vnDialogueText"]')?.parentElement as HTMLElement | null;
  if (box) {
    box.style.background = '';
    box.style.backgroundColor = merged.boxColor;
    box.style.backgroundImage = merged.boxImage ? `url("${merged.boxImage}")` : '';
    box.style.backgroundSize = 'cover';
    box.style.backgroundPosition = 'center';
    box.style.borderColor = merged.borderColor;
    box.style.borderWidth = `${Math.max(0, merged.borderWidth)}px`;
    box.style.borderRadius = `${Math.max(0, merged.borderRadius)}px`;
  }
  const speaker = document.getElementById('vnSpeakerName');
  if (speaker) {
    speaker.style.fontFamily = fontStackOf(merged.font);
    if (!node?.speakerColor) speaker.style.color = merged.speakerColor;
  }
  animateDialogueText(merged);
  return merged;
}

let __typeTimer: ReturnType<typeof setInterval> | null = null;

/** Renderiza #vnDialogueText con la animación de letras del tema. */
export function animateDialogueText(theme, explicitText?: string) {
  ensureAnimStyleTag();
  const el = document.getElementById('vnDialogueText');
  if (!el) return;
  const full = explicitText ?? el.textContent ?? '';
  if (__typeTimer) {
    clearInterval(__typeTimer);
    __typeTimer = null;
  }
  const speed = Math.max(0.25, Number(theme?.animSpeed) || 1);
  const anim = theme?.animation ?? 'none';
  el.style.fontFamily = fontStackOf(theme?.font ?? 'novela-sans');
  el.style.fontSize = `${Number(theme?.fontSize) || 16}px`;
  el.style.color = theme?.fontColor ?? '#f1f5f9';
  el.classList.add('vn-dlg-letters');
  el.classList.remove(
    'vn-dlg-anim-fade', 'vn-dlg-anim-slide-up', 'vn-dlg-anim-wave',
    'vn-dlg-anim-bounce', 'vn-dlg-anim-blur-in', 'vn-dlg-anim-rainbow'
  );

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!anim || anim === 'none' || reduceMotion) {
    el.textContent = full;
    return;
  }
  if (anim === 'typewriter') {
    // Máquina de escribir real: revela letra a letra (rápido pero legible).
    el.textContent = '';
    let i = 0;
    const step = Math.max(1, Math.round(speed));
    const delay = Math.max(8, Math.round(34 / speed));
    __typeTimer = setInterval(() => {
      i += step;
      el.textContent = full.slice(0, i);
      if (i >= full.length) {
        if (__typeTimer) clearInterval(__typeTimer);
        __typeTimer = null;
      }
    }, delay);
    // Clic en el texto completa la frase al instante.
    el.onclick = () => {
      if (__typeTimer) {
        clearInterval(__typeTimer);
        __typeTimer = null;
        el.textContent = full;
      }
    };
    return;
  }
  // Resto de animaciones: una <span> por letra con delay escalonado.
  el.innerHTML = '';
  el.classList.add(`vn-dlg-anim-${anim}`);
  const baseDelay = anim === 'wave' || anim === 'rainbow' ? 0.06 : 0.028 / speed;
  [...full].forEach((ch, idx) => {
    const s = document.createElement('span');
    s.textContent = ch;
    if (anim === 'wave' || anim === 'rainbow') {
      s.style.animationDelay = `${(idx * 0.06).toFixed(2)}s`;
    } else {
      s.style.animationDelay = `${(idx * baseDelay).toFixed(3)}s`;
    }
    el.appendChild(s);
  });
}

/** Estudio completo: elegir tema global, importar diseños, crear/editar. */
