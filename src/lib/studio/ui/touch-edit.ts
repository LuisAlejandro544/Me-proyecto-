// Studio module — ver src/lib/studio/index.ts barrel y docs/ARCHITECTURE.md.
// Conteo de toques para foto/vídeo en móvil + popup de confirmación.
//
// La edición por toques (un toque abre el panel, doble-toque edita el campo)
// funcionaba igual para todo. En móvil es fácil tocar sin querer una foto o
// un vídeo, así que esos dos casos cuentan los toques (1/2) y piden
// confirmación con `confirm()` antes de editar/asignar. En PC no cambia nada.
export const PHOTO_VIDEO_TAPS_REQUIRED = 2;
const TAP_WINDOW_MS = 2500;

const tapMemory = new Map<string, { count: number; t: number }>();

/** true en móvil/táctil (pantalla pequeña o puntero grueso). */
export function isTouchMobile(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia?.('(pointer: coarse)').matches) return true;
    if ('ontouchstart' in window) return true;
    if (navigator && ((navigator as { maxTouchPoints?: number }).maxTouchPoints ?? 0) > 0 && window.innerWidth < 820) return true;
    return window.innerWidth < 640;
  } catch {
    return false;
  }
}

/** ¿Este nodo muestra una foto (fondo/sprite) o un vídeo? */
export function isPhotoVideoNode(node: { type?: string } | null | undefined): boolean {
  if (!node?.type) return false;
  if (node.type === 'video_scene') return true;
  // Foto: fondo persistente, narración con fondo opcional y escenas con avatar/banner.
  return node.type === 'background' || node.type === 'avatar_scene' || node.type === 'banner_scene';
}

function kindLabel(nodeOrKind: { type?: string } | string | null | undefined): string {
  const type = typeof nodeOrKind === 'string' ? nodeOrKind : nodeOrKind?.type;
  return type === 'video_scene' ? 'vídeo' : 'foto';
}

/**
 * Cuenta un toque sobre `key` (id de nodo o de asset). Devuelve el conteo
 * actual dentro de la ventana (1..N). Pasada la ventana, reinicia en 1.
 */
export function countTouchTap(key: string): number {
  const now = Date.now();
  const prev = tapMemory.get(key);
  const count = prev && now - prev.t < TAP_WINDOW_MS ? prev.count + 1 : 1;
  tapMemory.set(key, { count, t: now });
  return count;
}

/** Reinicia el conteo de toques de `key` (tras confirmar o cancelar). */
export function resetTouchTaps(key: string): void {
  tapMemory.delete(key);
}

/**
 * Popup de confirmación para foto/vídeo con el conteo de toques visible.
 * Devuelve true si el usuario confirma. Siempre muestra el número de toque
 * para que «cuente los toques en móvil» de forma explícita.
 */
export function confirmPhotoVideoTouch(name: string, tapCount: number, action: 'editar' | 'asignar'): boolean {
  const kind = action === 'editar' ? 'Editar' : 'Asignar';
  try {
    return confirm(
      `${kind} (${tapCount}/${PHOTO_VIDEO_TAPS_REQUIRED} toques) — ¿${action === 'editar' ? 'abrir la edición' : 'usar este recurso'}?\n«${name}»`
    );
  } catch {
    return false;
  }
}

/** Etiqueta legible del nodo para los popups («foto» / «vídeo»). */
export function photoVideoKindOf(node: { type?: string } | null | undefined): string {
  return kindLabel(node);
}
