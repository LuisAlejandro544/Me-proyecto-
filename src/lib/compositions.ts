// Composiciones del editor de escenas: fondo + sprites superpuestos.
// Persisten en localStorage y se exportan a PNG para guardarlas en la
// carpeta de recursos (`saveCustomAssetFromDataUrl`).

export interface CompositionLayer {
  id: string;
  /** dataURL o URL del sprite (asset personalizado, sprite incluido o foto). */
  src: string;
  name: string;
  /** Posición en % del lienzo 16:9 (0-100). */
  x: number;
  y: number;
  /** Ancho en % del lienzo (alto proporcional). */
  w: number;
  opacity: number;
  flipH: boolean;
}

export interface Composition {
  id: string;
  name: string;
  /** dataURL del fondo (o '' = color liso). */
  background: string;
  bgName: string;
  bgFit: 'cover' | 'contain' | 'stretch';
  bgColor: string;
  layers: CompositionLayer[];
  updatedAt: number;
}

const STORAGE_KEY = 'vn_compositions_v1';

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function safeParse(raw: string | null): Composition[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((c) => c && typeof c.id === 'string' && Array.isArray(c.layers));
  } catch {
    return [];
  }
}

export function getCompositions(): Composition[] {
  try {
    return safeParse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveCompositions(list: Composition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* localStorage lleno: se sigue en memoria en esta sesión */
  }
}

export function createComposition(name = 'Escena compuesta'): Composition {
  return {
    id: uid('comp'),
    name,
    background: '',
    bgName: 'Color liso',
    bgFit: 'cover',
    bgColor: '#151b33',
    layers: [],
    updatedAt: Date.now()
  };
}

export function createLayer(src: string, name: string): CompositionLayer {
  return { id: uid('layer'), src, name, x: 50, y: 62, w: 34, opacity: 1, flipH: false };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}

/**
 * Renderiza la composición a PNG (1280x720) para guardarla en la carpeta.
 * Fondo en cover/contain/stretch + capas con opacidad y espejo horizontal.
 */
export async function renderCompositionToDataUrl(comp: Composition): Promise<string> {
  const W = 1280;
  const H = 720;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('Canvas no disponible');

  g.fillStyle = comp.bgColor || '#151b33';
  g.fillRect(0, 0, W, H);

  const drawCover = (img: HTMLImageElement) => {
    if (comp.bgFit === 'stretch') {
      g.drawImage(img, 0, 0, W, H);
    } else if (comp.bgFit === 'contain') {
      const s = Math.min(W / img.width, H / img.height);
      const dw = img.width * s;
      const dh = img.height * s;
      g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      const s = Math.max(W / img.width, H / img.height);
      const dw = img.width * s;
      const dh = img.height * s;
      g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }
  };

  if (comp.background) {
    try {
      drawCover(await loadImage(comp.background));
    } catch {
      /* fondo roto: se queda el color liso */
    }
  }

  for (const layer of comp.layers) {
    try {
      const img = await loadImage(layer.src);
      const dw = (Math.max(4, layer.w) / 100) * W;
      const dh = dw * (img.height / Math.max(1, img.width));
      const cx = (layer.x / 100) * W;
      const cy = (layer.y / 100) * H;
      g.save();
      g.globalAlpha = Math.min(1, Math.max(0.05, layer.opacity));
      g.translate(cx, cy);
      if (layer.flipH) g.scale(-1, 1);
      g.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      g.restore();
    } catch {
      /* capa ilegible: se salta */
    }
  }

  return canvas.toDataURL('image/png');
}
