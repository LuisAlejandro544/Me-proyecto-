// @ts-nocheck
// Workspace: animación de cambio de pestaña (extraído de ui/workspace.ts — barrel en ui/workspace.ts).
import { wsUi } from './state';
export function animateTabSwitch(tabName: string) {
  const bodyEl = document.getElementById('drawerModalBody');
  if (!bodyEl) { wsUi.tab = tabName; return; }
  bodyEl.classList.remove('vn-tab-enter');
  void (bodyEl as HTMLElement).offsetWidth;
  bodyEl.classList.add('vn-tab-enter');
  bodyEl.querySelectorAll('.vn-anim-card').forEach((el, i) => {
    (el as HTMLElement).style.animationDelay = `${Math.min(i * 45, 450)}ms`;
  });
  document.querySelectorAll('.nav-tab-btn').forEach((b) => {
    b.classList.remove('nav-tab-pop');
    if ((b as HTMLElement).dataset.tab === tabName) {
      void (b as HTMLElement).offsetWidth;
      b.classList.add('nav-tab-pop');
    }
  });
  wsUi.tab = tabName;
}
