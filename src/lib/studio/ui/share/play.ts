// @ts-nocheck
// Share: modo invitado y arranque (extraído de ui/share.ts — barrel en ui/share.ts).
import { ctx } from '../../context';
import { applyTransform } from '../transform';
import { renderNodes } from '../render-nodes';
import { renderPlaytestStep } from '../playtest';
import { showToast } from '../toast';
import { getStartNodeId } from '../../storage';
import { exportStandaloneHtmlFile } from '../compile';
import type { SharePermission } from './codec';
import { parseShareHash } from './base';
/** Descarga un .html jugable con el nivel incrustado: se puede enviar por chat/correo sin servidor. */
export async function downloadPlayableHtml() {
  try {
    await exportStandaloneHtmlFile();
  } catch { showToast('No se pudo generar el .html'); }
}

function setLoading(show: boolean, msg = '', pct = 5) {  const overlay = document.getElementById('shareLoading');
  if (!overlay) return;
  overlay.classList.toggle('hidden', !show);
  overlay.classList.toggle('flex', show);
  const msgEl = document.getElementById('shareLoadingMsg');
  const bar = document.getElementById('shareLoadingBar');
  if (msgEl && msg) msgEl.textContent = msg;
  if (bar) bar.style.width = `${Math.max(5, Math.min(100, pct))}%`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Carga el nivel compartido con pantallas de carga y abre el reproductor a pantalla completa. */
export async function enterSharedPlayMode(
  shared: { permiso: SharePermission; state: any; proyecto: string },
  opts: { demo?: boolean } = {}
) {
  setLoading(true, 'Conectando con la historia…', 8);
  await sleep(260);
  setLoading(true, `Cargando «${shared.proyecto}»…`, 28);
  await sleep(280);

  // Aplica el estado compartido en memoria (sin tocar el proyecto del editor salvo en demo).
  ctx.state = JSON.parse(JSON.stringify(shared.state));
  ctx.selectedNodeId = getStartNodeId(ctx.state);
  setLoading(true, `Cargando personajes (${ctx.state.nodes.length} nodos)…`, 55);
  await sleep(300);
  try {
    applyTransform();
    renderNodes();
  } catch {}
  setLoading(true, 'Preparando escenario a pantalla completa…', 82);
  await sleep(320);

  document.body.classList.add('shared-play-mode');
  const modal = document.getElementById('playtestModal');
  modal?.classList.remove('hidden');
  const badge = document.getElementById('vnCurrentNodeBadge');
  const closeBtn = document.getElementById('btnClosePlaytest');
  if (closeBtn) {
    closeBtn.textContent = opts.demo ? 'Volver al editor' : 'Salir';
    (closeBtn as HTMLElement).onclick = () => {
      if (opts.demo) {
        document.body.classList.remove('shared-play-mode');
        modal?.classList.add('hidden');
      } else {
        // En modo invitado no hay editor: vuelve a una pantalla neutra.
        setLoading(true, 'Gracias por jugar 🎮', 100);
        setTimeout(() => {
          location.hash = '';
          location.reload();
        }, 700);
      }
    };
  }
  const __startId = getStartNodeId(ctx.state);
  if (__startId) renderPlaytestStep(__startId);
  if (badge) badge.textContent = `${shared.proyecto} · modo invitado`;
  setLoading(true, '¡Listo! 🎬', 100);
  await sleep(280);
  setLoading(false);
  showToast(`Jugando «${shared.proyecto}» como invitado 🎮`);
}

/** Al arrancar: si la URL trae #nivel=…, entra directo en modo jugar. */
export async function checkSharedPlayModeOnBoot(): Promise<boolean> {
  const shared = parseShareHash();
  if (!shared) return false;
  // Deja que el DOM pinte primero la pantalla de carga.
  await sleep(60);
  await enterSharedPlayMode(shared);
  return true;
}
