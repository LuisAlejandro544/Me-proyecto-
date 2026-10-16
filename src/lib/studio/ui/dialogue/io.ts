// @ts-nocheck
// Diálogos: lectura de fondos y vista previa (extraído de ui/dialogue.ts — barrel en ui/dialogue.ts).
import { escapeHtml } from '../../domain/geometry';
import { showToast } from '../toast';
import { DIALOGUE_ANIMATIONS, DIALOGUE_FONTS, dialogueAnimationCss, fontStackOf } from '../../../dialogue-themes';
export function ensureAnimStyleTag() {
  let tag = document.getElementById('vnDlgAnimCss');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'vnDlgAnimCss';
    tag.textContent = dialogueAnimationCss();
    document.head.appendChild(tag);
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('read'));
    r.readAsDataURL(file);
  });
}

export async function pickBoxImage(): Promise<string | null> {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,.png,.jpg,.jpeg,.webp,.gif';
  input.style.display = 'none';
  document.body.appendChild(input);
  try {
    const picked = await new Promise<File | null>((resolve) => {
      let done = false;
      const finish = (f: File | null) => {
        if (done) return;
        done = true;
        resolve(f);
      };
      input.onchange = () => finish(input.files?.[0] ?? null);
      input.oncancel = () => finish(null);
      setTimeout(() => finish(input.files?.[0] ?? null), 60000);
      input.click();
    });
    if (!picked) return null;
    if (picked.size > 8 * 1024 * 1024) {
      showToast('Esa imagen pesa más de 8 MB: elige una más ligera para el cuadro');
      return null;
    }
    return await readFileAsDataUrl(picked);
  } finally {
    input.remove();
  }
}

export function previewHtml(theme, sample = '¡Hola! Este es tu cuadro de diálogo personalizado. ¿A dónde vamos?') {
  const esc = escapeHtml(sample);
  return `
    <div style="${theme.boxImage ? `background-image:url('${theme.boxImage}');background-size:cover;background-position:center;` : `background:${escapeHtml(theme.boxColor)};`}border:${Math.max(0, theme.borderWidth)}px solid ${escapeHtml(theme.borderColor)};border-radius:${Math.max(0, theme.borderRadius)}px;padding:16px 18px;box-shadow:0 10px 30px rgba(0,0,0,0.45);">
      <div style="font-weight:800;font-size:14px;margin-bottom:6px;color:${escapeHtml(theme.speakerColor)};font-family:${fontStackOf(theme.font)};">Sora</div>
      <div class="vn-dlg-letters vn-dlg-anim-${escapeHtml(theme.animation)}" style="font-family:${fontStackOf(theme.font)};font-size:${Number(theme.fontSize) || 16}px;color:${escapeHtml(theme.fontColor)};line-height:1.55;">${esc}</div>
      <div style="margin-top:8px;font-size:11px;opacity:0.75;color:${escapeHtml(theme.fontColor)};">${escapeHtml(DIALOGUE_ANIMATIONS.find((a) => a.id === theme.animation)?.label ?? theme.animation)} · ${escapeHtml(DIALOGUE_FONTS.find((f) => f.id === theme.font)?.label ?? theme.font)}</div>
    </div>`;
}
