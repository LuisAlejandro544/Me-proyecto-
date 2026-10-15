// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.

export function showToast(msg) {
  const banner = document.getElementById('toastBanner');
  document.getElementById('toastMessage').textContent = msg;
  banner.classList.remove('hidden');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => banner.classList.add('hidden'), 2400);
}
