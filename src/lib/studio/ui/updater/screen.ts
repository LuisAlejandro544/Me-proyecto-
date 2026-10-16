// @ts-nocheck
// Updater: pantalla de actualización (extraído de ui/updater.ts — barrel en ui/updater.ts).
import { showToast } from '../toast';
import { isTauri, isCapacitor } from '../../../platform';
import { escapeHtml } from '../../domain/geometry';
import type { UpdateRelease, InstallTarget } from './version';
import { resolveInstallTarget } from './assets';
import { getCurrentVersion } from './repo';
import { reloadAppHard } from './check';
export function sizeLabel(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function setDot(visible: boolean): void {
  const dot = document.getElementById('updateDot');
  if (dot) {
    dot.classList.toggle('hidden', !visible);
  }
  const btn = document.getElementById('btnCheckUpdates');
  if (btn) {
    btn.classList.toggle('border-emerald-400/70', visible);
    btn.classList.toggle('text-emerald-200', visible);
  }
}

export function setUpdateStatus(txt: string): void {
  const el = document.getElementById('updateStatus');
  if (el) el.textContent = txt;
}

export function setUpdateProgress(received: number, total: number): void {
  const wrap = document.getElementById('updateProgressWrap');
  const bar = document.getElementById('updateProgressBar');
  const lbl = document.getElementById('updateProgressLabel');
  if (wrap) wrap.classList.remove('hidden');
  if (bar) {
    const pct = total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0;
    (bar as HTMLElement).style.width = total > 0 ? `${pct}%` : '100%';
    (bar as HTMLElement).classList.toggle('animate-pulse', !(total > 0));
  }
  if (lbl) {
    lbl.textContent =
      total > 0
        ? `${sizeLabel(received)} de ${sizeLabel(total)}`
        : received > 0
          ? `${sizeLabel(received)} descargados…`
          : 'Descargando…';
  }
}

export function resetUpdateProgress(): void {
  const wrap = document.getElementById('updateProgressWrap');
  const bar = document.getElementById('updateProgressBar');
  const lbl = document.getElementById('updateProgressLabel');
  if (wrap) wrap.classList.add('hidden');
  if (bar) (bar as HTMLElement).style.width = '0%';
  if (lbl) lbl.textContent = '';
}

export function setBusy(busy: boolean): void {
  for (const id of ['btnDownloadUpdate', 'btnReloadApp', 'btnRemindUpdate', 'btnSkipUpdate']) {
    const b = document.getElementById(id) as HTMLButtonElement | null;
    if (b) b.disabled = busy;
  }
}

/** Pantalla "Nueva actualización disponible" (overlay dedicado #updateModal). */
export function openUpdateScreen(rel: UpdateRelease): void {
  const modal = document.getElementById('updateModal');
  if (!modal) return;
  const current = getCurrentVersion();
  const envLabel = isTauri() ? 'Escritorio (Tauri)' : isCapacitor() ? 'Móvil (Capacitor)' : 'Web';
  const set = (id: string, txt: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };
  set('updateVersionBadge', `${current} → ${rel.version || rel.tag}`);
  set('updateTitleName', rel.name || `Novedades de ${rel.tag}`);
  set('updateMeta', `${rel.tag} · ${rel.publishedAt ? new Date(rel.publishedAt).toLocaleDateString('es') : ''} · ${envLabel}`.trim());
  const notesEl = document.getElementById('updateNotes');
  if (notesEl) notesEl.textContent = rel.notes || 'Mejoras y correcciones.';
  resetUpdateProgress();
  setUpdateStatus('');

  const target = resolveInstallTarget(rel);
  const savedEl = document.getElementById('updateSavedPath');
  if (savedEl) savedEl.textContent = '';

  const dl = document.getElementById('btnDownloadUpdate') as HTMLButtonElement | null;
  if (dl) {
    if (target.kind === 'installer') {
      dl.textContent = `⬇️ Instalar actualización${target.asset.size ? ` (${sizeLabel(target.asset.size)})` : ''}`;
      dl.title = `Descarga ${target.asset.name} y abre el instalador`;
    } else if (target.kind === 'apk') {
      dl.textContent = `📲 Descargar e instalar APK${target.asset.size ? ` (${sizeLabel(target.asset.size)})` : ''}`;
      dl.title = `Descarga ${target.asset.name} y abre el instalador de Android`;
    } else if (target.kind === 'webzip') {
      dl.textContent = `📦 Descargar portable .zip${target.asset.size ? ` (${sizeLabel(target.asset.size)})` : ''}`;
      dl.title = 'El .zip NO se auto-instala: es el portable para reinstalar a mano';
    } else {
      dl.textContent = '📝 Ver release en GitHub';
      dl.title = 'Este release no trae archivos descargables';
    }
  }

  const zipEl = document.getElementById('updateZipInfo');
  if (zipEl) {
    const parts: string[] = [];
    if (rel.installer) parts.push(`⚙️ Instalador: ${rel.installer.name}${rel.installer.size ? ` (${sizeLabel(rel.installer.size)})` : ''}`);
    if (rel.apk) parts.push(`📲 APK: ${rel.apk.name}${rel.apk.size ? ` (${sizeLabel(rel.apk.size)})` : ''}`);
    if (rel.zip) parts.push(`📦 Portable: ${rel.zip.name}${rel.zip.size ? ` (${sizeLabel(rel.zip.size)})` : ''}`);
    zipEl.textContent = parts.length ? parts.join('\n') : 'Este release aún no trae archivos adjuntos.';
  }
  const hintEl = document.getElementById('updateEnvHint');
  if (hintEl) {
    hintEl.textContent = isTauri()
      ? target.kind === 'installer'
        ? 'En escritorio: pulsa «Instalar actualización», se descarga el instalador de tu sistema y se abre solo. Complétalo y la app quedará actualizada.'
        : 'Este release aún no trae instalador de escritorio: el .zip es el portable (descomprímelo a mano). La app NO se actualiza sola con el .zip.'
      : isCapacitor()
        ? target.kind === 'apk'
          ? 'En móvil: pulsa «Descargar e instalar APK» y acepta la instalación cuando Android lo pida. Así SÍ se actualiza la app.'
          : 'Este release aún no trae APK: el .zip es el portable web y NO actualiza la app instalada.'
        : 'En web la actualización se aplica al recargar (Pages ya sirve la nueva versión). El .zip es solo el portable: descargarlo NO actualiza esta pestaña.';
  }
  // En web el botón primario real es Recargar.
  const reload = document.getElementById('btnReloadApp') as HTMLButtonElement | null;
  if (reload && !isTauri() && !isCapacitor()) {
    reload.textContent = '🔄 Recargar app y aplicar';
  }
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setDot(true);

  const close = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };
  if (dl) {
    (dl as HTMLElement).onclick = () => {
      if (target.kind === 'none') {
        window.open(rel.htmlUrl, '_blank', 'noopener');
        return;
      }
      void downloadUpdateZip(rel);
    };
  }
  const later = document.getElementById('btnRemindUpdate');
  if (later) {
    (later as HTMLElement).onclick = () => {
      try {
        localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
      } catch {}
      close();
      showToast('Te avisaremos mañana 🔔');
    };
  }
  const skip = document.getElementById('btnSkipUpdate');
  if (skip) {
    (skip as HTMLElement).onclick = () => {
      try {
        localStorage.setItem(SKIP_KEY, rel.tag);
      } catch {}
      setDot(false);
      close();
      showToast(`Versión ${rel.tag} omitida`);
    };
  }
  const dismiss = document.getElementById('btnDismissUpdate');
  if (dismiss) {
    (dismiss as HTMLElement).onclick = close;
  }
  if (reload) {
    (reload as HTMLElement).onclick = () => {
      void reloadAppHard();
    };
  }
  const copy = document.getElementById('btnCopyUpdateLink');
  if (copy) {
    (copy as HTMLElement).onclick = async () => {
      const t = resolveInstallTarget(rel);
      const link = t.kind === 'none' ? rel.htmlUrl : (t as any).asset.url;
      try {
        await navigator.clipboard.writeText(link);
        showToast('Enlace de actualización copiado 🔗');
      } catch {
        showToast('Copia el enlace desde el release');
        window.open(link, '_blank', 'noopener');
      }
    };
  }
  const notes = document.getElementById('btnOpenReleaseNotes');
  if (notes) {
    (notes as HTMLElement).onclick = () => window.open(rel.htmlUrl, '_blank', 'noopener');
  }
}

/** Descarga con progreso real (streaming + Content-Length cuando existe). */
async function downloadBlobWithProgress(
  url: string,
  onProgress: (received: number, total: number) => void
): Promise<Blob> {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Descarga HTTP ${res.status}`);
  const total = Number(res.headers.get('content-length') || '0') || 0;
  if (!res.body || typeof (res.body as any).getReader !== 'function') {
    const blob = await res.blob();
    onProgress(blob.size, total || blob.size);
    return blob;
  }
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      try {
        onProgress(received, total);
      } catch {}
    }
  }
  return new Blob(chunks as BlobPart[]);
}

