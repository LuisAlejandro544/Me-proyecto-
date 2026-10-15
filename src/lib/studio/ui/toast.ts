// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.

export function showToast(msg) {
  const banner = document.getElementById('toastBanner');
  const label = document.getElementById('toastMessage');
  if (!banner || !label) return;
  label.textContent = msg;
  banner.classList.remove('hidden');
  // Reinicia la animación de entrada para avisos consecutivos.
  banner.classList.remove('toast-show', 'toast-hide');
  void banner.offsetWidth;
  banner.classList.add('toast-show');

  clearTimeout(window.__toastTimer);
  clearTimeout(window.__toastFadeTimer);
  // A los ~2s inicia el fundido de salida, a los 2.4s oculta del todo.
  window.__toastTimer = setTimeout(() => {
    banner.classList.remove('toast-show');
    banner.classList.add('toast-hide');
    window.__toastFadeTimer = setTimeout(() => {
      banner.classList.add('hidden');
      banner.classList.remove('toast-hide');
    }, 380);
  }, 2000);

  // Puentea al pill Svelte inferior si existe.
  try {
    if (typeof (globalThis as any).__toast === 'function') (globalThis as any).__toast(msg);
  } catch {}
}
