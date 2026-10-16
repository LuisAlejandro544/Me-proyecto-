// Canonical graph types extracted from my_novel_visual_novel_node_studio.html presets.
// New Svelte components should use these instead of `any`.

export type WireColor = 'cyan' | 'coral';
export type PortColor = WireColor;

export interface PortOut {
  id: string;
  color: PortColor;
  yOffset: number;
}

export interface ChoiceOption {
  id: string;
  label: string;
  style: string;
  inColor: PortColor;
  outColor: PortColor;
  /** Salto directo a una escena (sin necesidad de cable): al elegirla se juega el inicio de esa escena. */
  gotoSceneId?: string;
}

/** Agrupación narrativa: la escena 1 termina en un nodo y la 2 empieza en otro. */
export interface VNScene {
  id: string;
  /** Nombre personalizable que elige el usuario («Prólogo», «Bosque de noche»…). */
  name: string;
  /** Nodo donde empieza a jugarse esta escena (al entrar / saltar / continuar). */
  startNodeId?: string;
  /** Nodo donde termina esta escena (Continuar salta a la siguiente escena). */
  endNodeId?: string;
  /** Transición al entrar en esta escena (ver `SCENE_TRANSITIONS`; vacío = global). */
  enterTransition?: string;
}

export type NodeType =
  | 'banner_scene'
  | 'choice'
  | 'compact_scene'
  | 'character_selector'
  | 'avatar_scene'
  | 'branch_scene'
  | 'video_scene'
  | 'sound_cue'
  | string;

export type SoundTrigger = 'auto' | 'with_dialogue';

export type DialogueTextAnimation =
  | 'none'
  | 'typewriter'
  | 'fade'
  | 'slide-up'
  | 'wave'
  | 'bounce'
  | 'blur-in'
  | 'rainbow';

export interface VNNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  badge?: string;
  title?: string;
  subtitle?: string;
  topTitle?: string;
  topSubtitle?: string;
  headerBar?: string;
  characterId?: string;
  speaker?: string;
  speakerColor?: string;
  speakerSub?: string;
  dialogue?: string;
  portsOut?: PortOut[];
  options?: ChoiceOption[];
  selectedCharId?: string;
  expression?: string;
  scale?: number;
  position?: number;
  inColor?: PortColor;
  showAddButtons?: boolean;
  // Nodos de escena genéricos: audio de fondo / efecto asignado desde la carpeta.
  audioAssetId?: string;
  audioName?: string;
  // Bloque de vídeo: recurso de la carpeta + comportamiento de reproducción.
  videoAssetId?: string;
  videoName?: string;
  videoAutoplay?: boolean;
  videoLoop?: boolean;
  videoMuted?: boolean;
  videoControls?: boolean;
  // Nodo complemento de sonido: se reproduce al entrar en el paso.
  soundAssetId?: string;
  soundName?: string;
  volume?: number;
  loop?: boolean;
  trigger?: SoundTrigger;
  // Cuadro de diálogo personalizado (override por nodo; 'global' = usa el tema del proyecto).
  dlgThemeId?: string;
  dlgFont?: string;
  dlgAnimation?: DialogueTextAnimation;
  dlgFontSize?: number;
  dlgFontColor?: string;
  /** Escena a la que pertenece este nodo (agrupación visual + reproductor). */
  sceneId?: string;
  /** Al pulsar Continuar sin cable de salida, saltar al inicio de esta escena. */
  nextSceneId?: string;
  /** Animación de aparición del sprite/vídeo al llegar a este nodo (vacío = global). */
  assetEnter?: string;
  /** Movimiento continuo del sprite en este paso (flotar, latir…; vacío = global). */
  assetMotion?: string;
  /** Transición de escenario al llegar a este nodo (vacío = escena/global). */
  sceneTransition?: string;
}

export interface VNWire {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
  color: WireColor;
}

export interface VNState {
  projectName: string;
  /** Nodo donde empieza la partida (elegible en el editor; fallback: nodes[0]). */
  startNodeId?: string;
  /** Tema de cuadro de diálogo activo para todo el proyecto. */
  dialogueThemeId?: string;
  /** Animaciones globales de assets/escenarios (fallback de nodos y escenas). */
  defaultAssetEnter?: string;
  defaultAssetMotion?: string;
  defaultSceneTransition?: string;
  /** Duración base de apariciones/transiciones en ms (120–2000, defecto 450). */
  animDurationMs?: number;
  /** Escenas narrativas ordenadas (nombre personalizable + inicio/fin por nodo). */
  scenes?: VNScene[];
  zoom: number;
  panX: number;
  panY: number;
  variables: Record<string, string | number | boolean>;
  nodes: VNNode[];
  wires: VNWire[];
}

// Snapshot pushed on every mutating action (undo/redo).
export interface GraphSnapshot {
  nodes: VNNode[];
  wires: VNWire[];
  variables: VNState['variables'];
  scenes?: VNScene[];
}

export type DragMode = 'node' | 'wire' | 'pan' | 'pinch';

// Pointer-drag session. Only `mode` is always present; the rest depends on it.
export interface DragState {
  mode: DragMode;
  pointerId?: number;
  moved?: boolean;
  // node drag
  nodeId?: string;
  origX?: number;
  origY?: number;
  // pan baseline (screen px)
  startX?: number;
  startY?: number;
  origPanX?: number;
  origPanY?: number;
  // wire drag
  fromNode?: string;
  fromPort?: string;
  color?: PortColor;
}

export type SfxKind = 'click' | 'connect' | 'choice';

// Point in unscaled canvas-world coordinates.
export interface Point {
  x: number;
  y: number;
}
