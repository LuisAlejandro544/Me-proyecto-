// @ts-nocheck
// Updater: assets del release (extraído de ui/updater.ts — barrel en ui/updater.ts).
import type { UpdateAsset, UpdateRelease, InstallTarget } from './version';
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

