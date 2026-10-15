// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.

export const PRESET_SORA = {
  projectName: 'Mi Novela',
  zoom: 0.92,
  panX: 20,
  panY: 15,
  variables: { affection_sora: 10, visited_forest: false, school_key: false },
  nodes: [
    {
      id: 'start_scene_1',
      type: 'banner_scene',
      badge: 'Escena inicial 1',
      x: 65,
      y: 85,
      width: 245,
      characterId: 'sora',
      speaker: 'Sora',
      speakerColor: '#ff758c',
      dialogue: '¡Hola! Qué bueno que llegaste.\n¿A dónde vamos?',
      portsOut: [
        { id: 'out_coral', color: 'coral', yOffset: 120 },
        { id: 'out_cyan', color: 'cyan', yOffset: 205 }
      ]
    },
    {
      id: 'choice_deciding',
      type: 'choice',
      title: 'Elección:',
      subtitle: 'Decidiendo',
      x: 385,
      y: 135,
      width: 225,
      options: [
        { id: 'opt_forest', label: 'Ir al bosque', style: 'dark', inColor: 'cyan', outColor: 'cyan' },
        { id: 'opt_school', label: 'Explorar la escuela', style: 'dark', inColor: 'coral', outColor: 'coral' }
      ]
    },
    {
      id: 'forest_scene',
      type: 'compact_scene',
      title: 'Escena del bosque',
      x: 695,
      y: 80,
      width: 225,
      characterId: 'sora',
      speaker: 'Sora',
      dialogue: '¡Hola! Qué bueno que llegaste.\n¿A dónde vamos?',
      inColor: 'cyan'
    },
    {
      id: 'char_selector',
      type: 'character_selector',
      title: 'Selector de personaje',
      x: 695,
      y: 265,
      width: 230,
      selectedCharId: 'yuki',
      expression: 'Yuki - Alegre',
      scale: 92,
      position: 62,
      inColor: 'coral'
    }
  ],
  wires: [
    { id: 'w1', fromNode: 'start_scene_1', fromPort: 'out_coral', toNode: 'choice_deciding', toPort: 'in_opt_school', color: 'coral' },
    { id: 'w2', fromNode: 'start_scene_1', fromPort: 'out_cyan', toNode: 'choice_deciding', toPort: 'in_opt_forest', color: 'cyan' },
    { id: 'w3', fromNode: 'choice_deciding', fromPort: 'out_opt_forest', toNode: 'forest_scene', toPort: 'in_main', color: 'cyan' },
    { id: 'w4', fromNode: 'choice_deciding', fromPort: 'out_opt_school', toNode: 'char_selector', toPort: 'in_main', color: 'coral' }
  ]
};
export const PRESET_AOI = {
  projectName: 'Mi Novela',
  zoom: 0.70,
  panX: 35,
  panY: 25,
  variables: { patience: 5, teased_aoi: false },
  nodes: [
    {
      id: 'node_1_intro',
      type: 'avatar_scene',
      topTitle: 'Nodo 1: Introducción',
      topSubtitle: 'Inicio',
      headerBar: 'Escena 1: Encuentro',
      x: 75,
      y: 145,
      width: 250,
      characterId: 'aoi',
      speaker: 'Aoi (Casual)',
      speakerSub: 'Thumbnail',
      dialogue: '¡Hola! ¿Esperaste mucho?',
      portsOut: [
        { id: 'out_1', color: 'cyan', yOffset: 112 },
        { id: 'out_2', color: 'cyan', yOffset: 144 }
      ]
    },
    {
      id: 'node_2_split',
      type: 'choice',
      title: 'Nodo 2: Bifurcación de decisión',
      subtitle: 'Nodo de elección',
      showAddButtons: true,
      x: 405,
      y: 125,
      width: 245,
      options: [
        { id: 'opt_a', label: 'Opción A: "Sí, una eternidad"', style: 'coral', inColor: 'cyan', outColor: 'coral' },
        { id: 'opt_b', label: 'Opción B: "Para nada"', style: 'teal', inColor: 'cyan', outColor: 'cyan' }
      ]
    },
    {
      id: 'node_3_apology',
      type: 'branch_scene',
      headerBar: 'Nodo 3: Escena 1A (Disculpa)',
      x: 735,
      y: 55,
      width: 255,
      characterId: 'mio',
      speaker: 'Aoi',
      dialogue: 'Aoi: "Ay no, lo siento\'m so sorry!"',
      inColor: 'coral'
    },
    {
      id: 'node_4_tease',
      type: 'branch_scene',
      headerBar: 'Nodo 4: Escena 1B (Broma)',
      x: 735,
      y: 265,
      width: 255,
      characterId: 'mio',
      speaker: 'Aoi',
      dialogue: 'Aoi: "Je, lo sabía."',
      inColor: 'cyan'
    }
  ],
  wires: [
    { id: 'wa1', fromNode: 'node_1_intro', fromPort: 'out_1', toNode: 'node_2_split', toPort: 'in_opt_a', color: 'cyan' },
    { id: 'wa2', fromNode: 'node_1_intro', fromPort: 'out_2', toNode: 'node_2_split', toPort: 'in_opt_a', color: 'cyan' },
    { id: 'wa3', fromNode: 'node_2_split', fromPort: 'out_opt_a', toNode: 'node_3_apology', toPort: 'in_main', color: 'coral' },
    { id: 'wa4', fromNode: 'node_2_split', fromPort: 'out_opt_b', toNode: 'node_4_tease', toPort: 'in_main', color: 'cyan' }
  ]
};
