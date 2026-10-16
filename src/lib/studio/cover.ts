// Miniatura de portada: captura esquemática del lienzo (dónde quedó el grafo
// al salir) como data-URL SVG. Sin dependencias ni DOM: solo el estado.
import type { VNState } from '../types';

const W = 320;
const H = 180;
const MAX_DRAW = 250;

function typeColor(t: string): string {
  if (t === 'choice') return '#fb7185';
  if (t === 'branch_scene') return '#818cf8';
  if (t === 'banner_scene') return '#38bdf8';
  if (t === 'character_selector') return '#34d399';
  if (t === 'video_scene') return '#e879f9';
  if (t === 'sound_cue') return '#fbbf24';
  if (t === 'jump') return '#7dd3fc';
  if (t === 'ending') return '#34d399';
  if (t === 'background') return '#fb923c';
  if (t === 'narration') return '#94a3b8';
  if (t === 'monologue') return '#c084fc';
  if (t === 'wait') return '#fde047';
  if (t === 'effect') return '#f472b6';
  return '#38bdf8';
}

/** SVG 320×180 del grafo (nodos + cables) o '' si no hay nada que dibujar. */
export function buildCoverThumbnail(state: VNState): string {
  try {
    const nodes = (state?.nodes ?? []).slice(0, MAX_DRAW);
    if (!nodes.length) return '';
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      const w = n.width || 240;
      const h = 120;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + w);
      maxY = Math.max(maxY, n.y + h);
    }
    const pad = 24;
    const bw = Math.max(1, maxX - minX + pad * 2);
    const bh = Math.max(1, maxY - minY + pad * 2);
    const k = Math.min(W / bw, H / bh);
    const ox = (W - bw * k) / 2;
    const oy = (H - bh * k) / 2;
    const X = (x: number) => (ox + (x - minX + pad) * k).toFixed(1);
    const Y = (y: number) => (oy + (y - minY + pad) * k).toFixed(1);
    const ids = new Set(nodes.map((n) => n.id));
    let wires = '';
    for (const w of (state?.wires ?? []).slice(0, MAX_DRAW)) {
      const a = nodes.find((n) => n.id === (w as { fromNode?: string }).fromNode);
      const b = nodes.find((n) => n.id === (w as { toNode?: string }).toNode);
      if (!a || !b || !ids.has(a.id) || !ids.has(b.id)) continue;
      const x1 = a.x + (a.width || 240);
      const y1 = a.y + 60;
      const x2 = b.x;
      const y2 = b.y + 60;
      const mx = ((x1 + x2) / 2).toFixed(1);
      wires += `<path d="M${X(x1)},${Y(y1)} C${mx},${Y(y1)} ${mx},${Y(y2)} ${X(x2)},${Y(y2)}" stroke="rgba(0,242,254,0.5)" stroke-width="1.4" fill="none"/>`;
    }
    let rects = '';
    for (const n of nodes) {
      const w = n.width || 240;
      rects += `<rect x="${X(n.x)}" y="${Y(n.y)}" width="${((w * k).toFixed(1))}" height="${((120 * k).toFixed(1))}" rx="6" fill="rgba(30,38,70,0.95)" stroke="${typeColor(n.type)}" stroke-width="1.6"/>`;
    }
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
      `<defs><pattern id="d" width="16" height="16" patternUnits="userSpaceOnUse">` +
      `<circle cx="1.5" cy="1.5" r="1" fill="rgba(148,163,218,0.25)"/></pattern></defs>` +
      `<rect width="${W}" height="${H}" fill="#0e1326"/>` +
      `<rect width="${W}" height="${H}" fill="url(#d)"/>` +
      wires + rects + `</svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  } catch {
    return '';
  }
}
