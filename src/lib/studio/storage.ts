// Guardado local: menú principal con continuar + 3 slots + nombre + nodo inicial.
// Todo vive en localStorage del usuario (sin servidor).
// NOTA: este módulo no importa render-nodes/transform para evitar ciclos;
// quienes lo usan (index, MainMenu, toolbar) renderizan después de aplicar.
import { ctx } from './context';
import { showToast } from './ui/toast';
import { normalizeScenes } from './domain/scenes';
import type { VNState } from '../types';

export const MAX_SLOTS = 3;
const SLOTS_KEY = 'vn_slots_v1';
const AUTOSAVE_KEY = 'vn_autosave_v1';
const ACTIVE_SLOT_KEY = 'vn_active_slot_v1';

export interface SaveSlot {
  name: string;
  updatedAt: number;
  state: VNState;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLS(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

/** Normaliza un estado cargado: garantiza startNodeId válido. */
export function normalizeState(state: VNState): VNState {
  if (!state || !Array.isArray((state as VNState).nodes)) return state;
  const ids = new Set(state.nodes.map((n) => n.id));
  const s = state as VNState & { startNodeId?: string };
  if (!s.startNodeId || !ids.has(s.startNodeId)) {
    s.startNodeId = state.nodes[0]?.id ?? '';
  }
  if (typeof s.projectName !== 'string' || !s.projectName.trim()) {
    s.projectName = 'Mi Novela';
  }
  try {
    normalizeScenes(state);
  } catch {}
  return state;
}

/** Nodo donde empieza la partida (elegible por el usuario, con fallback al primero). */
export function getStartNodeId(state: VNState = ctx.state): string {
  const wanted = (state as VNState & { startNodeId?: string }).startNodeId;
  if (wanted && state.nodes.some((n) => n.id === wanted)) return wanted;
  return state.nodes[0]?.id ?? '';
}

export function setStartNodeId(nodeId: string): void {
  const node = ctx.state.nodes.find((n) => n.id === nodeId);
  if (!node) return;
  (ctx.state as VNState & { startNodeId?: string }).startNodeId = nodeId;
  ctx.selectedNodeId = nodeId;
  scheduleAutosave();
  const label = node.badge || node.title || node.headerBar || nodeId;
  showToast(`▶ Inicio de partida: «${label}»`);
}

// ---- Slots ----

export function loadSlots(): Array<SaveSlot | null> {
  const raw = safeParse<Array<SaveSlot | null>>(readLS(SLOTS_KEY), []);
  const out: Array<SaveSlot | null> = [null, null, null];
  for (let i = 0; i < MAX_SLOTS; i++) {
    const s = raw[i];
    if (s && s.state && Array.isArray(s.state.nodes)) {
      normalizeState(s.state);
      out[i] = s;
    }
  }
  return out;
}

function writeSlots(slots: Array<SaveSlot | null>): void {
  writeLS(SLOTS_KEY, JSON.stringify(slots));
}

export function saveSlot(index: number, name?: string): void {
  const slots = loadSlots();
  const state = clone(ctx.state);
  normalizeState(state);
  const slotName = (name ?? state.projectName ?? `Historia ${index + 1}`).trim() || `Historia ${index + 1}`;
  state.projectName = slotName;
  slots[index] = { name: slotName, updatedAt: Date.now(), state };
  writeSlots(slots);
  setActiveSlot(index);
  syncProjectLabel();
}

export function saveSlotState(index: number, state: VNState, name: string): void {
  const slots = loadSlots();
  const copy = clone(state);
  normalizeState(copy);
  copy.projectName = name.trim() || copy.projectName || `Historia ${index + 1}`;
  slots[index] = { name: copy.projectName, updatedAt: Date.now(), state: copy };
  writeSlots(slots);
}

export function clearSlot(index: number): void {
  const slots = loadSlots();
  slots[index] = null;
  writeSlots(slots);
  if (getActiveSlot() === index) setActiveSlot(null);
}

export function getActiveSlot(): number | null {
  const raw = readLS(ACTIVE_SLOT_KEY);
  if (raw === null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n >= MAX_SLOTS) return null;
  return n;
}

export function setActiveSlot(index: number | null): void {
  try {
    if (index === null) localStorage.removeItem(ACTIVE_SLOT_KEY);
    else localStorage.setItem(ACTIVE_SLOT_KEY, String(index));
  } catch {}
}

// ---- Autosave / continuar ----

export function loadAutosave(): { name: string; updatedAt: number; state: VNState } | null {
  const raw = safeParse<{ name: string; updatedAt: number; state: VNState } | null>(readLS(AUTOSAVE_KEY), null);
  if (!raw || !raw.state || !Array.isArray(raw.state.nodes) || !raw.state.nodes.length) return null;
  normalizeState(raw.state);
  return raw;
}

let __autosaveTimer: ReturnType<typeof setTimeout> | null = null;

/** Guarda la sesión actual (para «Continuar donde la dejé») con debounce. */
export function scheduleAutosave(): void {
  if (__autosaveTimer) clearTimeout(__autosaveTimer);
  __autosaveTimer = setTimeout(() => {
    __autosaveTimer = null;
    try {
      const state = clone(ctx.state);
      normalizeState(state);
      writeLS(AUTOSAVE_KEY, JSON.stringify({ name: state.projectName, updatedAt: Date.now(), state }));
      // Si hay un slot activo, lo mantiene sincronizado en silencio.
      const active = getActiveSlot();
      if (active !== null) {
        const slots = loadSlots();
        const prev = slots[active];
        slots[active] = { name: state.projectName, updatedAt: Date.now(), state };
        // Conserva el nombre del slot si el usuario lo nombró distinto al proyecto.
        if (prev && prev.name && prev.name !== state.projectName && state.projectName === prev.state?.projectName) {
          slots[active]!.name = prev.name;
        }
        writeSlots(slots);
      }
    } catch {}
  }, 500);
}

export function saveSessionNow(): void {
  if (__autosaveTimer) {
    clearTimeout(__autosaveTimer);
    __autosaveTimer = null;
  }
  try {
    const state = clone(ctx.state);
    normalizeState(state);
    writeLS(AUTOSAVE_KEY, JSON.stringify({ name: state.projectName, updatedAt: Date.now(), state }));
  } catch {}
}

// ---- Aplicar / renombrar ----

export function applyLoadedState(state: VNState, opts: { slotIndex?: number | null } = {}): void {
  const copy = clone(state);
  normalizeState(copy);
  ctx.state = copy;
  ctx.selectedNodeId = getStartNodeId(copy);
  ctx.selectedWireId = null;
  ctx.historyStack = [];
  ctx.redoStack = [];
  if (typeof opts.slotIndex !== 'undefined') setActiveSlot(opts.slotIndex);
  scheduleAutosave();
  syncProjectLabel();
}

export function renameProject(name: string): void {
  const clean = (name || '').trim() || 'Mi Novela';
  ctx.state.projectName = clean;
  const active = getActiveSlot();
  if (active !== null) {
    const slots = loadSlots();
    const prev = slots[active];
    if (prev) {
      prev.name = clean;
      prev.state.projectName = clean;
      prev.updatedAt = Date.now();
      writeSlots(slots);
    }
  }
  scheduleAutosave();
  syncProjectLabel();
  showToast(`Historia: «${clean}» ✏️`);
}

export function syncProjectLabel(): void {
  try {
    const el = document.getElementById('currentProjectLabel');
    if (el) el.textContent = ctx.state.projectName || 'Mi Novela';
    const input = document.getElementById('projectNameInput') as HTMLInputElement | null;
    if (input && document.activeElement !== input) input.value = ctx.state.projectName || '';
  } catch {}
}

export function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
