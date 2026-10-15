// @ts-nocheck
// Auto-actualizaciones: escanea el último GitHub Release y guía la instalación.
// Canal: workflow `.github/workflows/auto-update.yml` (solo en release
// publicado o manual, nunca por push/PR) adjunta al release el zip web de
// toda la app + `update.json` (+ `latest.json`) y —cuando se compilan— los
// instaladores nativos (.exe/.msi, .AppImage/.deb, .dmg, .apk).
//
// La app compara `tag_name` con su versión y muestra la pantalla
// "Nueva actualización" (#updateModal). A diferencia del sistema anterior
// (que solo guardaba un .zip sin aplicar nada), este flujo SÍ actualiza:
//  - Tauri/desktop: descarga el instalador de tu plataforma y lo ABRE para
//    que completes la instalación (vía plugin-opener). Sin instalador en el
//    release, guarda el .zip portable y lo dice claro (no finge actualizar).
//  - Capacitor/Android: descarga el .apk y abre el instalador del sistema.
//  - Web: la actualización real es recargar Pages (hard-reload sin caché);
//    el .zip es solo el portable, no actualiza la pestaña por sí solo.
// Sin firma de binarios no hay updater silencioso en caliente: el plugin
// firmado de Tauri queda documentado en docs/RELEASING.md (roadmap).
import { showToast } from './toast';
import { isTauri, isCapacitor } from '../../platform';
import { escapeHtml } from '../domain/geometry';

const REPO_KEY = 'vn_update_repo_v1';
const SKIP_KEY = 'vn_update_skipped_tag_v1';
const LAST_CHECK_KEY = 'vn_update_last_check_v1';
const AUTO_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function getUpdateRepo(): string {
  try {
    const saved = (localStorage.getItem(REPO_KEY) || '').trim();
    if (saved) return saved.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
  } catch {}
  const envRepo = (import.meta as any)?.env?.VITE_UPDATE_REPO;
  if (envRepo) return String(envRepo);
  return 'LuisAlejandro544/Me-proyecto-';
}

export function setUpdateRepo(repo: string): void {
  try {
    localStorage.setItem(REPO_KEY, (repo || '').trim());
  } catch {}
}

export function getCurrentVersion(): string {
  try {
    const v = (globalThis as any).__APP_VERSION__;
    if (v) return String(v);
  } catch {}
  try {
    const env = (import.meta as any)?.env?.VITE_APP_VERSION;
    if (env) return String(env);
  } catch {}
  return '0.1.0';
}

function normTag(tag: string): string {
  return String(tag || '').trim().replace(/^v/i, '');
}

function parseParts(v: string): number[] {
  return normTag(v)
    .split(/[.+-]/)
    .map((p) => parseInt(p, 10))
    .map((n) => (Number.isFinite(n) ? n : 0));
}

/** -1 si a<b, 0 igual, 1 si a>b. */
export function compareVersions(a: string, b: string): number {
  const pa = parseParts(a);
  const pb = parseParts(b);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

export function isUpdateAvailable(current: string, rel: UpdateRelease | null): boolean {
  if (!rel?.tag) return false;
  return compareVersions(current, rel.version || normTag(rel.tag)) < 0;
}

export type UpdateAsset = { name: string; url: string; size: number };
export type UpdateRelease = {
  tag: string;
  version: string;
  name: string;
  notes: string;
  htmlUrl: string;
  publishedAt: string;
  /** .zip web portable (NO actualiza por sí solo: hay que reinstalar/recargar). */
  zip: UpdateAsset | null;
  /** Instalador nativo ideal para este dispositivo (SÍ actualiza al ejecutarlo). */
  installer: UpdateAsset | null;
  /** .apk del release (Android/Capacitor). */
  apk: UpdateAsset | null;
  manifestUrl: string | null;
};

export type InstallTarget =
  | { kind: 'installer'; asset: UpdateAsset }
  | { kind: 'apk'; asset: UpdateAsset }
  | { kind: 'webzip'; asset: UpdateAsset }
  | { kind: 'none' };

function isSig(name: string): boolean {
  return /\.sig$/i.test(name || '');
}

function findAsset(assets: any[], re: RegExp): UpdateAsset | null {
  const a = (assets || []).find((x) => re.test(String(x?.name || '')) && !isSig(String(x?.name || '')));
  return a ? { name: String(a.name), url: String(a.browser_download_url), size: Number(a.size ?? 0) || 0 } : null;
}

/** Elige el instalador nativo según la plataforma actual (o null si no hay). */
export function pickInstallerAsset(assets: any[]): UpdateAsset | null {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const list = (assets || []).filter((a) => !isSig(String(a?.name || '')));
  if (isCapacitor() || /android/i.test(ua)) {
    return findAsset(list, /\.apk$/i);
  }
  if (/windows|win64|win32/i.test(ua)) {
    return findAsset(list, /-setup\.exe$/i) ?? findAsset(list, /\.exe$/i) ?? findAsset(list, /\.msi$/i);
  }
  if (/mac|darwin/i.test(ua)) {
    return findAsset(list, /\.dmg$/i) ?? findAsset(list, /\.app\.tar\.gz$/i);
  }
  // Linux / resto desktop: AppImage antes que .deb (no pide sudo).
  return (
    findAsset(list, /\.appimage$/i) ??
    findAsset(list, /\.deb$/i) ??
    findAsset(list, /-setup\.exe$/i) ??
    findAsset(list, /\.msi$/i)
  );
}

/** Qué botón/acción aplica de verdad la actualización en este entorno. */
export function resolveInstallTarget(rel: UpdateRelease): InstallTarget {
  if (isCapacitor() && rel.apk) return { kind: 'apk', asset: rel.apk };
  if (isTauri() && rel.installer) return { kind: 'installer', asset: rel.installer };
  // En Tauri sin instalador publicado, el .apk no sirve y el .zip es portable.
  if (rel.zip) return { kind: 'webzip', asset: rel.zip };
  if (rel.installer) return { kind: 'installer', asset: rel.installer };
  if (rel.apk) return { kind: 'apk', asset: rel.apk };
  return { kind: 'none' };
}

function releaseFromApi(j: any, repo: string): UpdateRelease {
  const assets = Array.isArray(j?.assets) ? j.assets : [];
  const webZip =
    findAsset(assets, /my-novel-studio-web-.*\.zip$/i) ?? findAsset(assets, /\.zip$/i) ?? null;
  // Evita que el .zip web se confunda con un instalador de escritorio.
  const nativePool = assets.filter((a) => a && a.name !== webZip?.name);
  const installer = pickInstallerAsset(nativePool);
  const apk = /apk$/i.test(installer?.name ?? '') ? installer : findAsset(assets, /\.apk$/i);
  const manifest = assets.find((a) => a?.name === 'update.json') ?? null;
  return {
    tag: String(j.tag_name || ''),
    version: normTag(j.tag_name || ''),
    name: String(j.name || j.tag_name || 'Nueva versión'),
    notes: String(j.body || '').slice(0, 2000),
    htmlUrl: String(j.html_url || `https://github.com/${repo}/releases/latest`),
    publishedAt: String(j.published_at || ''),
    zip: webZip,
    installer: installer && !/apk$/i.test(installer.name) ? installer : null,
    apk,
    manifestUrl: manifest ? String(manifest.browser_download_url) : null
  };
}

/** Plan B sin rate-limit: `update.json` servido vía redirect de GitHub. */
async function fetchManifestFallback(repo: string, timeoutMs: number): Promise<UpdateRelease | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://github.com/${repo}/releases/latest/download/update.json`, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal
    });
    if (!res.ok) return null;
    const m = await res.json();
    const tag = String(m.tag || m.version || '');
    if (!tag) return null;
    const webName = String(m?.assets?.web_zip || '');
    const webUrl = String(m?.assets?.web_url || '');
    return {
      tag,
      version: normTag(tag),
      name: `Novedades de ${tag}`,
      notes: String(m.notes || m.install_hint || ''),
      htmlUrl: `https://github.com/${repo}/releases/tag/${tag}`,
      publishedAt: String(m.published_at || ''),
      zip: webName && webUrl ? { name: webName, url: webUrl, size: 0 } : null,
      installer: null,
      apk: null,
      manifestUrl: `https://github.com/${repo}/releases/latest/download/update.json`
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchLatestRelease(repo = getUpdateRepo(), timeoutMs = 9000): Promise<UpdateRelease | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: ctrl.signal
    });
    if (res.status === 404) return null; // aún sin releases
    if (res.status === 403 || res.status === 429) {
      // Rate-limit de la API sin token: cae al manifiesto directo.
      return await fetchManifestFallback(repo, timeoutMs);
    }
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    return releaseFromApi(await res.json(), repo);
  } catch (e) {
    // Sin red o API bloqueada: último intento vía manifiesto (no cuenta rate-limit).
    try {
      const fb = await fetchManifestFallback(repo, timeoutMs);
      if (fb) return fb;
    } catch {}
    throw e;
  } finally {
    clearTimeout(t);
  }
}

function sizeLabel(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function setDot(visible: boolean): void {
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

function setUpdateStatus(txt: string): void {
  const el = document.getElementById('updateStatus');
  if (el) el.textContent = txt;
}

function setUpdateProgress(received: number, total: number): void {
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

function resetUpdateProgress(): void {
  const wrap = document.getElementById('updateProgressWrap');
  const bar = document.getElementById('updateProgressBar');
  const lbl = document.getElementById('updateProgressLabel');
  if (wrap) wrap.classList.add('hidden');
  if (bar) (bar as HTMLElement).style.width = '0%';
  if (lbl) lbl.textContent = '';
}

function setBusy(busy: boolean): void {
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
export function checkForUpdatesOnBoot(delayMs = 3500): void {
  window.setTimeout(() => {
    checkForUpdates({ silent: true }).catch(() => {});
  }, delayMs);
}

if (typeof window !== 'undefined') {
  (window as any).__updater = {
    checkForUpdates,
    fetchLatestRelease,
    compareVersions,
    getCurrentVersion,
    getUpdateRepo,
    isUpdateAvailable,
    resolveInstallTarget,
    reloadAppHard
  };
}
