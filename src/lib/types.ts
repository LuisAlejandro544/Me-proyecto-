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
}

export type NodeType =
  | 'banner_scene'
  | 'choice'
  | 'compact_scene'
  | 'character_selector'
  | 'avatar_scene'
  | 'branch_scene'
  | string;

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
  zoom: number;
  panX: number;
  panY: number;
  variables: Record<string, string | number | boolean>;
  nodes: VNNode[];
  wires: VNWire[];
}
