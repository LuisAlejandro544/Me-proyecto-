// @ts-nocheck
// Updater: chequeo contra GitHub (extraído de ui/updater.ts — barrel en ui/updater.ts).
import { showToast } from '../toast';
import { isTauri, isCapacitor } from '../../../platform';
import { escapeHtml } from '../../domain/geometry';
import { getUpdateRepo, getCurrentVersion } from './repo';
import { compareVersions, isUpdateAvailable } from './version';
import type { UpdateRelease } from './version';
import { fetchLatestRelease, resolveInstallTarget } from './assets';
import { openUpdateScreen, resetUpdateProgress, setBusy, setUpdateProgress, setUpdateStatus } from './screen';
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('No se pudo leer la descarga'));
      fr.onload = () => resolve(String(fr.result || ''));
      fr.readAsDataURL(blob);
    } catch (e) {
      reject(e);
    }
  });
}

/** Recarga dura: limpia caché/SW cuando puede y recarga (la vía real en web). */
export async function reloadAppHard(): Promise<void> {
  showToast('Aplicando actualización… 🔄');
  setUpdateStatus('Recargando la última versión publicada…');
  try {
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {}
    }
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      } catch {}
    }
    try {
      await fetch(window.location.href, { cache: 'reload' });
    } catch {}
  } finally {
    window.location.reload();
  }
}

/**
 * Descarga la actualización y la APLICA según la plataforma:
 * - Tauri + instalador: guarda con diálogo y ABRE el instalador (actualiza de verdad).
 * - Capacitor + APK: guarda en caché y abre el instalador de Android.
 * - Resto / .zip portable: descarga el archivo e indica que NO se auto-instala.
 */
export async function downloadUpdateZip(rel: UpdateRelease): Promise<void> {
  const target = resolveInstallTarget(rel);
  if (target.kind === 'none') {
    window.open(rel.htmlUrl, '_blank', 'noopener');
    showToast('Este release aún no trae archivos: abierto en GitHub');
    return;
  }
  const asset = (target as any).asset as UpdateAsset;
  const filename = asset.name || `my-novel-studio-${rel.tag}.zip`;
  setBusy(true);
  resetUpdateProgress();
  try {
    // Tauri: diálogo guardar + descarga binaria + apertura del instalador.
    if (isTauri()) {
      try {
        const [{ save }, { writeFile }] = await Promise.all([
          import('@tauri-apps/plugin-dialog'),
          import('@tauri-apps/plugin-fs')
        ]);
        const path = await (save as any)({
          defaultPath: filename,
          filters:
            target.kind === 'installer'
              ? [{ name: 'Instalador', extensions: ['exe', 'msi', 'AppImage', 'deb', 'dmg'] }]
              : [{ name: 'ZIP', extensions: ['zip'] }]
        });
        if (!path) {
          setBusy(false);
          return;
        }
        setUpdateStatus(
          target.kind === 'installer' ? `Descargando instalador ${filename}…` : `Descargando portable ${filename}…`
        );
        showToast('Descargando actualización… 📦');
        const blob = await downloadBlobWithProgress(asset.url, setUpdateProgress);
        const buf = new Uint8Array(await blob.arrayBuffer());
        await (writeFile as any)(path, buf);
        const savedEl = document.getElementById('updateSavedPath');
        if (savedEl) savedEl.textContent = `Guardado en: ${path}`;
        if (target.kind === 'installer') {
          setUpdateStatus('Instalador descargado. Abriéndolo para completar la actualización…');
          try {
            const { openPath } = await import('@tauri-apps/plugin-opener');
            await (openPath as any)(path);
            showToast('Instalador abierto: completa la instalación ⚙️');
            setUpdateStatus('Completa el instalador que se acaba de abrir para terminar de actualizar.');
          } catch {
            showToast('Instalador guardado: ábrelo para actualizar ⚙️');
            setUpdateStatus('No se pudo abrir solo: haz doble clic en el instalador guardado.');
          }
        } else {
          showToast('Portable guardado 📦 (no auto-instala: descomprímelo a mano)');
          setUpdateStatus('El .zip es el portable: descomprímelo a mano. La app instalada NO cambia sola.');
        }
        setBusy(false);
        return;
      } catch (e) {
        // cae al anchor clásico (p. ej. plugins no disponibles)
      }
    }
    if (isCapacitor()) {
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');
        setUpdateStatus(
          target.kind === 'apk' ? `Descargando APK ${filename}…` : `Descargando portable ${filename}…`
        );
        showToast('Descargando actualización… 📦');
        const blob = await downloadBlobWithProgress(asset.url, setUpdateProgress);
        const dataUrl = await blobToDataUrl(blob);
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const saved = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
        const savedEl = document.getElementById('updateSavedPath');
        if (savedEl) savedEl.textContent = `Guardado en caché: ${filename}`;
        setUpdateStatus(target.kind === 'apk' ? 'Abriendo el instalador de Android…' : 'Portable listo para compartir.');
        await Share.share({
          title: 'Actualización disponible',
          url: saved.uri,
          dialogTitle: target.kind === 'apk' ? 'Instala el APK para actualizar' : 'Guardar/compartir .zip'
        });
        if (target.kind === 'apk') showToast('Acepta la instalación para actualizar 📲');
        setBusy(false);
        return;
      } catch (e) {
        // cae al anchor clásico
      }
    }
    setUpdateStatus(`Descargando ${filename}…`);
    showToast('Descargando actualización… 📦');
    const blob = await downloadBlobWithProgress(asset.url, setUpdateProgress);
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
    if (target.kind === 'installer' || target.kind === 'apk') {
      setUpdateStatus('Descargado. Ejecuta el instalador para completar la actualización.');
      showToast('Descargado: ejecuta el instalador para actualizar ⚙️');
    } else {
      setUpdateStatus('Portable descargado. En web: pulsa «Recargar app» para usar la última versión.');
      showToast('Portable descargado 📦 (no auto-instala)');
    }
  } catch (e) {
    setUpdateStatus('Falló la descarga. Revisa tu conexión o abre el release en GitHub.');
    showToast('Falló la descarga: prueba con «Ver release»');
  } finally {
    setBusy(false);
  }
}

export type CheckOpts = { silent?: boolean; manual?: boolean };

/** Compara con el último release; si hay versión mayor muestra la pantalla. */
export async function checkForUpdates(opts: CheckOpts = {}): Promise<UpdateRelease | null> {
  const { silent = true, manual = false } = opts;
  try {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
      if (!silent) showToast('Sin conexión: no se pudo buscar actualizaciones');
      return null;
    }
    // Invitados con #nivel=…: solo chequeo manual para no interrumpir la partida.
    if (!manual && /nivel=/.test(location.hash || '')) return null;
    if (silent && !manual) {
      let last = 0;
      try {
        last = Number(localStorage.getItem(LAST_CHECK_KEY) || '0');
      } catch {}
      if (Date.now() - last < AUTO_INTERVAL_MS) return null;
    }
    const rel = await fetchLatestRelease();
    try {
      localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
    } catch {}
    if (!rel?.tag) {
      if (!silent) showToast('Aún no hay releases publicados');
      setDot(false);
      return null;
    }
    const skipped = (() => {
      try {
        return localStorage.getItem(SKIP_KEY) || '';
      } catch {
        return '';
      }
    })();
    if (isUpdateAvailable(getCurrentVersion(), rel) && (manual || skipped !== rel.tag)) {
      openUpdateScreen(rel);
      const t = resolveInstallTarget(rel);
      if (!silent) {
        showToast(
          t.kind === 'installer'
            ? `Nueva versión ${rel.tag} disponible: con instalador 🎉`
            : t.kind === 'apk'
              ? `Nueva versión ${rel.tag} disponible: con APK 📲`
              : `Nueva versión ${rel.tag} disponible 🎉`
        );
      } else setDot(true);
      return rel;
    }
    setDot(false);
    if (!silent) showToast('Ya tienes la última versión ✅');
    return null;
  } catch (e) {
    if (!silent) showToast('No se pudo contactar con GitHub Releases');
    return null;
  }
}

/** Chequeo silencioso al arrancar (con retardo para no tapar la carga inicial). */
