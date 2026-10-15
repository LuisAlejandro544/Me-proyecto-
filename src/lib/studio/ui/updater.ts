// @ts-nocheck
// Auto-actualizaciones: escanea el último GitHub Release y avisa con pantalla.
// Canal: workflow `.github/workflows/auto-update.yml` (solo en release
// publicado o manual, nunca por push/PR) adjunta al release el zip web de
// toda la app + `update.json`. La app compara `tag_name` con su
// versión y ofrece descargar el .zip (web) o instalar el nuevo build (Tauri).
// No hay hot-swap en caliente: la web recarga Pages y desktop reinstala.
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

export type UpdateAsset = { name: string; url: string; size: number };
export type UpdateRelease = {
  tag: string;
  version: string;
  name: string;
  notes: string;
  htmlUrl: string;
  publishedAt: string;
  zip: UpdateAsset | null;
  manifestUrl: string | null;
};

export async function fetchLatestRelease(repo = getUpdateRepo(), timeoutMs = 9000): Promise<UpdateRelease | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: ctrl.signal
    });
    if (res.status === 404) return null; // aún sin releases
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const j = await res.json();
    const assets = Array.isArray(j.assets) ? j.assets : [];
    const webZip =
      assets.find((a) => /my-novel-studio-web-.*\.zip$/i.test(a?.name || '')) ??
      assets.find((a) => /\.zip$/i.test(a?.name || '')) ??
      null;
    const manifest = assets.find((a) => a?.name === 'update.json') ?? null;
    return {
      tag: String(j.tag_name || ''),
      version: normTag(j.tag_name || ''),
      name: String(j.name || j.tag_name || 'Nueva versión'),
      notes: String(j.body || '').slice(0, 2000),
      htmlUrl: String(j.html_url || `https://github.com/${repo}/releases/latest`),
      publishedAt: String(j.published_at || ''),
      zip: webZip ? { name: webZip.name, url: webZip.browser_download_url, size: webZip.size ?? 0 } : null,
      manifestUrl: manifest ? manifest.browser_download_url : null
    };
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
  if (notesEl) notesEl.textContent = rel.notes || 'Mejoras y correcciones. Descarga el .zip web con toda la app.';
  const zipEl = document.getElementById('updateZipInfo');
  if (zipEl) {
    zipEl.textContent = rel.zip
      ? `📦 ${rel.zip.name}${rel.zip.size ? ` (${sizeLabel(rel.zip.size)})` : ''}`
      : 'El release aún no tiene .zip web adjunto.';
  }
  const hintEl = document.getElementById('updateEnvHint');
  if (hintEl) {
    hintEl.textContent = isTauri()
      ? 'En escritorio: descarga el .zip para ver la web nueva al instante, o instala el próximo .exe/.deb del release para actualizar el programa.'
      : isCapacitor()
        ? 'En móvil: descarga el .zip para llevarte la web nueva; la app instalada se actualiza con el próximo APK.'
        : 'En web: descarga el .zip con toda la app (dist/ + html jugable) o pulsa «Recargar app» si ya se publicó en Pages.';
  }
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setDot(true);

  const close = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };
  const dl = document.getElementById('btnDownloadUpdate');
  if (dl) {
    (dl as HTMLElement).onclick = () => downloadUpdateZip(rel);
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
  const reload = document.getElementById('btnReloadApp');
  if (reload) {
    (reload as HTMLElement).onclick = () => location.reload();
  }
  const copy = document.getElementById('btnCopyUpdateLink');
  if (copy) {
    (copy as HTMLElement).onclick = async () => {
      const link = rel.zip?.url ?? rel.htmlUrl;
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

/** Descarga el .zip del release (web: anchor; Tauri/Capacitor: diálogo nativo si puede). */
export async function downloadUpdateZip(rel: UpdateRelease): Promise<void> {
  const url = rel.zip?.url;
  if (!url) {
    window.open(rel.htmlUrl, '_blank', 'noopener');
    showToast('Este release aún no trae .zip: abierto en GitHub');
    return;
  }
  const filename = rel.zip.name || `my-novel-studio-${rel.tag}.zip`;
  // Tauri: diálogo guardar + descarga binaria (sin plugin updater firmado).
  if (isTauri()) {
    try {
      const [{ save }, { writeFile }] = await Promise.all([
        import('@tauri-apps/plugin-dialog'),
        import('@tauri-apps/plugin-fs')
      ]);
      const path = await (save as any)({ defaultPath: filename, filters: [{ name: 'ZIP', extensions: ['zip'] }] });
      if (!path) return;
      showToast('Descargando actualización… 📦');
      const buf = await (await fetch(url)).arrayBuffer();
      await (writeFile as any)(path, new Uint8Array(buf));
      showToast('Actualización guardada: descomprime el .zip 📦');
      return;
    } catch {
      // cae al anchor clásico
    }
  }
  if (isCapacitor()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      showToast('Descargando actualización… 📦');
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const saved = await Filesystem.writeFile({ path: filename, data: btoa(binary), directory: Directory.Cache });
      await Share.share({ title: 'Actualización disponible', url: saved.uri, dialogTitle: 'Guardar/compartir .zip' });
      return;
    } catch {
      // cae al anchor clásico
    }
  }
  showToast('Descargando actualización… 📦');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
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
      const last = Number(localStorage.getItem(LAST_CHECK_KEY) || '0');
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
    const cmp = compareVersions(getCurrentVersion(), rel.version);
    if (cmp < 0 && (manual || skipped !== rel.tag)) {
      openUpdateScreen(rel);
      if (!silent) showToast(`Nueva versión ${rel.tag} disponible 🎉`);
      else setDot(true);
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
  (window as any).__updater = { checkForUpdates, fetchLatestRelease, compareVersions, getCurrentVersion, getUpdateRepo };
}
