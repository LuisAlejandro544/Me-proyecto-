// Miniaturas de portada del menú:
// 1) `captureCanvasShot` — Roblox-style: rasteriza el lienzo REAL (nodos, cables,
//    pan/zoom de la vista al salir) a JPEG vía foreignObject. Sin dependencias.
// 2) `buildCoverThumbnail` — fallback esquemático (solo estado) si la captura falla.
import type { VNState } from '../types';

const W = 320;
const H = 180;
const MAX_DRAW = 250;
const SHOT_KEY = 'vn_canvas_shot_v1';

interface CanvasShot {
  project: string;
  at: number;
  dataUrl: string;
}

/** Último pantallazo real del lienzo; válido solo si es del mismo proyecto. */
export function readCanvasShot(projectName: string): string | null {
  try {
    const shot = JSON.parse(localStorage.getItem(SHOT_KEY) || 'null') as CanvasShot | null;
    if (!shot?.dataUrl || shot.project !== projectName) return null;
    return shot.dataUrl;
  } catch {
    return null;
  }
}

/** Rasteriza el canvas actual (con su pan/zoom tal como quedó) a JPEG y lo guarda. */
export function captureCanvasShot(projectName: string, afterShot?: () => void): void {
  try {
    const vp = document.getElementById('canvasViewport');
    if (!vp) return;
    const r = vp.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) return;
    // CSS del documento (Tailwind + app.css) para que el clon se pinte igual.
    let css = '';
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) css += rule.cssText + '\n';
      } catch {} /* hoja CORS: se salta */
    }
    const box = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    const clone = vp.cloneNode(true) as Element;
    // Fuera HUD flotante (pills, FAB, minimapa): al clon solo entra el lienzo.
    Array.from(clone.children).forEach((ch) => {
      if ((ch as Element).id !== 'panLayer') (ch as Element).remove();
    });
    // El clon pierde el tamaño que le daba el contexto flex de la página:
    // le fijamos el rect real para que panLayer (inset-0) lo ocupe.
    (clone as HTMLElement).style.cssText += `width:${r.width}px;height:${r.height}px;`;
    box.appendChild(clone);
    box.style.cssText = `width:${r.width}px;height:${r.height}px;position:relative;overflow:hidden;`;
    const inner = new XMLSerializer().serializeToString(box);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(r.width)}" height="${Math.round(r.height)}" viewBox="0 0 ${Math.round(r.width)} ${Math.round(r.height)}">` +
      `<style><![CDATA[${css}]]></style>` +
      `<rect width="100%" height="100%" fill="#0d1124"/>` +
      `<foreignObject width="100%" height="100%">${inner}</foreignObject></svg>`;
    const img = new Image();
    const fin = () => {
      try {
        const TW = 560; // ancho fijo del thumbnail
        const TH = Math.max(40, Math.round((r.height / r.width) * TW));
        const c = document.createElement('canvas');
        c.width = TW;
        c.height = TH;
        const cx = c.getContext('2d');
        if (!cx) return;
        cx.fillStyle = '#0d1124';
        cx.fillRect(0, 0, TW, TH);
        cx.drawImage(img, 0, 0, TW, TH);
        // Guardia real: si casi todos los píxeles son el fondo plano, la
        // rasterización falló (antes usábamos el peso del JPEG, engañoso).
        const px = cx.getImageData(0, 0, TW, TH).data;
        let diff = 0;
        for (let i = 0; i < px.length; i += 16) {
          if (Math.abs(px[i] - 13) + Math.abs(px[i + 1] - 17) + Math.abs(px[i + 2] - 36) > 24) diff++;
        }
        if (diff < (px.length / 16) * 0.02) return; // plano → queda el esquemático
        const url = c.toDataURL('image/jpeg', 0.82);
        try {
          localStorage.setItem(SHOT_KEY, JSON.stringify({ project: projectName, at: Date.now(), dataUrl: url } as CanvasShot));
        } catch {} /* cuota llena: se conserva la anterior */
        try { afterShot?.(); } catch {}
        // Avisa al menú (si está montado) para que relea covers con el shot real.
        try { window.dispatchEvent(new CustomEvent('vn:cover-shot')); } catch {}
      } catch {} /* canvas taint u otro fallo: queda el fallback */
    };
    img.onload = () => {
      // Sin decode() el drawImage pinta a veces la imagen sin rasterizar (negro).
      const d = (img as unknown as { decode?: () => Promise<void> }).decode;
      if (typeof d === 'function') {
        d.call(img).then(fin, () => { try { fin(); } catch {} });
      } else { fin(); }
    };
    img.onerror = () => {};
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  } catch {} /* el menú usa el fallback esquemático */
}

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
