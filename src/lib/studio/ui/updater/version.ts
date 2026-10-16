// @ts-nocheck
// Updater: comparación de versiones (extraído de ui/updater.ts — barrel en ui/updater.ts).
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

