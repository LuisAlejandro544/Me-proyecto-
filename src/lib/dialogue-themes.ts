// Librería de cuadros de diálogo: diseños importables + tipografías + animaciones.
// - Los diseños viven en localStorage (biblioteca del usuario) y el proyecto
//   solo guarda `dialogueThemeId` (VNState) + overrides por nodo.
// - El .html compilado incrusta el tema resuelto (ver compile.ts) así que
//   funciona offline en file:// sin depender de Google Fonts.
export type DialogueTextAnimation =
  | 'none'
  | 'typewriter'
  | 'fade'
  | 'slide-up'
  | 'wave'
  | 'bounce'
  | 'blur-in'
  | 'rainbow';

export interface DialogueFontOption {
  id: string;
  label: string;
  stack: string;
}

export interface DialogueAnimationOption {
  id: DialogueTextAnimation;
  label: string;
  desc: string;
}

/** Un diseño de cuadro de diálogo (fondo + tipografía + animación). */
export interface DialogueBoxTheme {
  id: string;
  name: string;
  /** Fondo sólido del cuadro (se ignora si hay boxImage). */
  boxColor: string;
  /** Imagen de fondo importada por el usuario (dataURL) o '' para color plano. */
  boxImage: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  /** Tipografía del texto del diálogo (id de DIALOGUE_FONTS o stack libre). */
  font: string;
  fontSize: number;
  fontColor: string;
  speakerColor: string;
  /** Animación de las letras + velocidad (1 = normal, 2 = doble de rápido…). */
  animation: DialogueTextAnimation;
  animSpeed: number;
  custom?: boolean;
  createdAt?: number;
}

/** Muchas tipografías sin depender de red: stacks del sistema con personalidades distintas. */
export const DIALOGUE_FONTS: DialogueFontOption[] = [
  { id: 'novela-sans', label: 'Novela Sans (moderna)', stack: `'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif` },
  { id: 'clásica-serif', label: 'Clásica Serif (libro)', stack: `Georgia, 'Times New Roman', serif` },
  { id: 'redondeada', label: 'Redondeada (acogedora)', stack: `'Trebuchet MS', 'Segoe UI Rounded', 'Nunito', sans-serif` },
  { id: 'manuscrita', label: 'Manuscrita (diario)', stack: `'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive` },
  { id: 'cómic', label: 'Cómic (divertida)', stack: `'Comic Sans MS', 'Chalkboard SE', 'Segoe Print', cursive` },
  { id: 'pixel', label: 'Pixel retro (arcade)', stack: `'Courier New', 'Lucida Console', monospace` },
  { id: 'máquina', label: 'Máquina de escribir', stack: `'Courier New', Courier, monospace` },
  { id: 'mono-tech', label: 'Mono técnica', stack: `ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace` },
  { id: 'fantasía', label: 'Fantasía (pergamino)', stack: `Palatino, 'Palatino Linotype', 'Book Antiqua', Georgia, serif` },
  { id: 'elegante', label: 'Elegante (títulos)', stack: `Didot, 'Bodoni MT', 'Playfair Display', Georgia, serif` },
  { id: 'impacto', label: 'Impacto (gruesa)', stack: `Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif` },
  { id: 'futura', label: 'Futura (cyber)', stack: `Futura, 'Century Gothic', 'Avenir Next', sans-serif` },
  { id: 'lectura-fácil', label: 'Lectura fácil (grande)', stack: `Verdana, Geneva, Tahoma, sans-serif` },
  { id: 'gótica', label: 'Gótica (terror)', stack: `'Old English Text MT', 'UnifrakturMaguntia', Georgia, serif` }
];

export const DIALOGUE_ANIMATIONS: DialogueAnimationOption[] = [
  { id: 'none', label: 'Sin animación', desc: 'El texto aparece al instante.' },
  { id: 'typewriter', label: '⌨️ Máquina de escribir', desc: 'Letra a letra, como las novelas clásicas.' },
  { id: 'fade', label: '✨ Fundido por letra', desc: 'Cada letra aparece con un fundido.' },
  { id: 'slide-up', label: '⬆️ Deslizar hacia arriba', desc: 'Las letras suben al aparecer.' },
  { id: 'wave', label: '🌊 Ola', desc: 'Las letras flotan en onda continua.' },
  { id: 'bounce', label: '⚽ Rebote', desc: 'Cada letra rebota al entrar.' },
  { id: 'blur-in', label: '🔍 Enfoque', desc: 'De borroso a nítido, letra a letra.' },
  { id: 'rainbow', label: '🌈 Arcoíris', desc: 'Colores animados en bucle sobre el texto.' }
];

export function fontStackOf(fontId: string): string {
  const found = DIALOGUE_FONTS.find((f) => f.id === fontId);
  if (found) return found.stack;
  if (!fontId) return DIALOGUE_FONTS[0].stack;
  // Stack libre (tema importado de otra versión): úsalo tal cual.
  return fontId;
}

export function animationLabelOf(id: string): string {
  return DIALOGUE_ANIMATIONS.find((a) => a.id === id)?.label ?? id;
}

const PRESETS: DialogueBoxTheme[] = [
  {
    id: 'clasico-oscuro', name: 'Clásico oscuro', boxColor: '#12172d',
    boxImage: '', borderColor: '#00f2fe', borderWidth: 1, borderRadius: 16,
    font: 'novela-sans', fontSize: 16, fontColor: '#f1f5f9', speakerColor: '#ff758c',
    animation: 'typewriter', animSpeed: 1
  },
  {
    id: 'novela-clara', name: 'Novela clara', boxColor: '#fdf6ec',
    boxImage: '', borderColor: '#b45309', borderWidth: 2, borderRadius: 18,
    font: 'clásica-serif', fontSize: 17, fontColor: '#431407', speakerColor: '#b45309',
    animation: 'fade', animSpeed: 1
  },
  {
    id: 'romance', name: 'Romance rosa', boxColor: '#2b1030',
    boxImage: '', borderColor: '#f9a8d4', borderWidth: 2, borderRadius: 22,
    font: 'redondeada', fontSize: 16, fontColor: '#fce7f3', speakerColor: '#f9a8d4',
    animation: 'wave', animSpeed: 1
  },
  {
    id: 'pixel-retro', name: 'Pixel retro', boxColor: '#0a0a12',
    boxImage: '', borderColor: '#4ade80', borderWidth: 3, borderRadius: 6,
    font: 'pixel', fontSize: 15, fontColor: '#bbf7d0', speakerColor: '#4ade80',
    animation: 'typewriter', animSpeed: 1.4
  },
  {
    id: 'pergamino', name: 'Pergamino fantasía', boxColor: '#2a1f10',
    boxImage: '', borderColor: '#d4a24e', borderWidth: 2, borderRadius: 12,
    font: 'fantasía', fontSize: 17, fontColor: '#f5e6c8', speakerColor: '#fbbf24',
    animation: 'blur-in', animSpeed: 1
  },
  {
    id: 'neon-cyber', name: 'Neón cyber', boxColor: '#050510',
    boxImage: '', borderColor: '#22d3ee', borderWidth: 2, borderRadius: 14,
    font: 'futura', fontSize: 16, fontColor: '#cffafe', speakerColor: '#22d3ee',
    animation: 'slide-up', animSpeed: 1.2
  }
];

const LIB_KEY = 'vn_dialogue_themes_v1';
const ACTIVE_KEY = 'vn_dialogue_active_theme_v1';

function safeParse(raw: string | null): DialogueBoxTheme[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((t) => t && typeof t.id === 'string' && typeof t.name === 'string');
  } catch {
    return [];
  }
}

export function getCustomDialogueThemes(): DialogueBoxTheme[] {
  try {
    return safeParse(localStorage.getItem(LIB_KEY));
  } catch {
    return [];
  }
}

export function getAllDialogueThemes(): DialogueBoxTheme[] {
  const customs = getCustomDialogueThemes();
  const seen = new Set(customs.map((t) => t.id));
  return [...customs, ...PRESETS.filter((p) => !seen.has(p.id))];
}

export function getDialogueTheme(id?: string | null): DialogueBoxTheme {
  const all = getAllDialogueThemes();
  return all.find((t) => t.id === id) ?? all.find((t) => t.id === getActiveDialogueThemeId()) ?? PRESETS[0];
}

export function getActiveDialogueThemeId(): string {
  try {
    const saved = localStorage.getItem(ACTIVE_KEY);
    if (saved && getAllDialogueThemes().some((t) => t.id === saved)) return saved;
  } catch {}
  return PRESETS[0].id;
}

export function setActiveDialogueThemeId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('vn:dialogue-theme-changed', { detail: { id } }));
  } catch {}
}

export function saveCustomDialogueTheme(theme: DialogueBoxTheme): DialogueBoxTheme {
  const clean: DialogueBoxTheme = {
    ...theme,
    id: theme.id || `dlg_${Date.now().toString(36)}`,
    name: (theme.name || 'Mi diseño').trim().slice(0, 48) || 'Mi diseño',
    custom: true,
    createdAt: theme.createdAt ?? Date.now()
  };
  const rest = getCustomDialogueThemes().filter((t) => t.id !== clean.id);
  rest.unshift(clean);
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(rest.slice(0, 60)));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('vn:dialogue-theme-changed', { detail: { id: clean.id } }));
  } catch {}
  return clean;
}

export function deleteCustomDialogueTheme(id: string): void {
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(getCustomDialogueThemes().filter((t) => t.id !== id)));
  } catch {}
  if (getActiveDialogueThemeId() === id) setActiveDialogueThemeId(PRESETS[0].id);
}

export function blankDialogueTheme(): DialogueBoxTheme {
  return {
    id: `dlg_${Date.now().toString(36)}`,
    name: 'Mi diseño',
    boxColor: '#12172d',
    boxImage: '',
    borderColor: '#00f2fe',
    borderWidth: 2,
    borderRadius: 16,
    font: 'novela-sans',
    fontSize: 16,
    fontColor: '#f1f5f9',
    speakerColor: '#ff758c',
    animation: 'typewriter',
    animSpeed: 1,
    custom: true,
    createdAt: Date.now()
  };
}

/** CSS compartido para las animaciones de letras (playtest + .html compilado). */
export function dialogueAnimationCss(prefix = ''): string {
  const p = prefix ? `${prefix} ` : '';
  return `
${p}.vn-dlg-letters span { display: inline-block; white-space: pre; }
${p}.vn-dlg-anim-fade span { opacity: 0; animation: vn-dlg-fade 0.35s ease forwards; }
${p}.vn-dlg-anim-slide-up span { opacity: 0; transform: translateY(8px); animation: vn-dlg-rise 0.35s ease forwards; }
${p}.vn-dlg-anim-bounce span { opacity: 0; animation: vn-dlg-bounce 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
${p}.vn-dlg-anim-blur-in span { opacity: 0; filter: blur(6px); animation: vn-dlg-blur 0.45s ease forwards; }
${p}.vn-dlg-anim-wave span { animation: vn-dlg-wave 1.6s ease-in-out infinite; }
${p}.vn-dlg-anim-rainbow span { animation: vn-dlg-rainbow 2.4s linear infinite; }
@keyframes vn-dlg-fade { to { opacity: 1; } }
@keyframes vn-dlg-rise { to { opacity: 1; transform: translateY(0); } }
@keyframes vn-dlg-bounce { 0% { opacity: 0; transform: translateY(10px) scale(0.6); } 60% { opacity: 1; transform: translateY(-3px) scale(1.08); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes vn-dlg-blur { to { opacity: 1; filter: blur(0); } }
@keyframes vn-dlg-wave { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes vn-dlg-rainbow { 0% { color: #f87171; } 20% { color: #fb923c; } 40% { color: #facc15; } 60% { color: #4ade80; } 80% { color: #22d3ee; } 100% { color: #f87171; } }
@media (prefers-reduced-motion: reduce) {
${p}.vn-dlg-letters span { opacity: 1 !important; transform: none !important; filter: none !important; animation: none !important; }
}`;
}

/** Estilo en línea del cuadro según el tema (playtest + previsualizaciones). */
export function dialogueBoxStyle(theme: DialogueBoxTheme): string {
  return [
    `background-color:${theme.boxColor}`,
    theme.boxImage ? `background-image:url("${theme.boxImage}")` : '',
    'background-size:cover',
    'background-position:center',
    `border:${Math.max(0, theme.borderWidth)}px solid ${theme.borderColor}`,
    `border-radius:${Math.max(0, theme.borderRadius)}px`
  ].filter(Boolean).join(';');
}

/** Tema efectivo de un nodo: override por nodo o tema global del proyecto. */
export function resolveNodeDialogueTheme(
  node: { dlgThemeId?: string; dlgFont?: string; dlgAnimation?: DialogueTextAnimation; dlgFontSize?: number; dlgFontColor?: string } | undefined,
  projectThemeId?: string | null
): DialogueBoxTheme {
  const base = getDialogueTheme(node?.dlgThemeId && node.dlgThemeId !== 'global' ? node.dlgThemeId : projectThemeId || getActiveDialogueThemeId());
  const out: DialogueBoxTheme = { ...base };
  if (node?.dlgFont) out.font = node.dlgFont;
  if (node?.dlgAnimation) out.animation = node.dlgAnimation;
  if (typeof node?.dlgFontSize === 'number' && node.dlgFontSize > 0) out.fontSize = node.dlgFontSize;
  if (node?.dlgFontColor) out.fontColor = node.dlgFontColor;
  return out;
}

/** Tema global efectivo del proyecto (VNState.dialogueThemeId o biblioteca activa). */
export function getProjectDialogueThemeId(state?: { dialogueThemeId?: string } | null): string {
  const id = (state as { dialogueThemeId?: string } | undefined)?.dialogueThemeId;
  if (id && getAllDialogueThemes().some((t) => t.id === id)) return id;
  return getActiveDialogueThemeId();
}
