// @ts-nocheck
// Editor completo de nodos: preguntas/diálogos, personaje, opciones y borrado.
// Se abre con el botón ✏️ de cada nodo (táctil) o doble-clic en el texto.
import { ctx } from '../context';
import { findCustomAsset, getAudioAssets, getCharacterCatalog, getVideoAssets } from '../../assets';
import { escapeHtml } from '../domain/geometry';
import { pushHistory } from '../domain/history';
import { renderNodes } from './render-nodes';
import { showToast } from './toast';
import { setStartNodeId } from '../storage';
import { DIALOGUE_ANIMATIONS, DIALOGUE_FONTS, getAllDialogueThemes, getProjectDialogueThemeId } from '../../dialogue-themes';
import { openDialogueStudio } from './dialogue';

function dialogueStyleFields(node: any, inputCls: string, field: (label: string, inner: string) => string): string {
  if (node.type === 'character_selector') return '';
  const themes = getAllDialogueThemes();
  const projectId = getProjectDialogueThemeId(ctx.state);
  const curTheme = node.dlgThemeId ?? 'global';
  const curFont = node.dlgFont ?? '';
  const curAnim = node.dlgAnimation ?? '';
  return `
    <div class="p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/40 space-y-2.5">
      <div class="flex items-center justify-between gap-2">
        <div class="text-[11px] uppercase tracking-wider text-fuchsia-200 font-bold">💬 Cuadro de diálogo de este nodo</div>
        <button id="ed_openDlgStudio" type="button" class="px-2.5 py-1.5 rounded-lg bg-fuchsia-500 text-white text-[11px] font-bold shrink-0 min-h-[36px]">Personalizar…</button>
      </div>
      ${field('Diseño del cuadro', `<select id="ed_dlgTheme" class="${inputCls}">
        <option value="global" ${curTheme === 'global' ? 'selected' : ''}>🌐 Tema global (${escapeHtml(themes.find((t) => t.id === projectId)?.name ?? 'Clásico')})</option>
        ${themes.map((t) => `<option value="${t.id}" ${curTheme === t.id ? 'selected' : ''}>${t.custom ? '🖼️' : '🎨'} ${escapeHtml(t.name)}</option>`).join('')}
      </select>`)}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${field('Tipografía (override)', `<select id="ed_dlgFont" class="${inputCls}">
          <option value="">— La del diseño —</option>
          ${DIALOGUE_FONTS.map((f) => `<option value="${f.id}" ${curFont === f.id ? 'selected' : ''}>${escapeHtml(f.label)}</option>`).join('')}
        </select>`)}
        ${field('Animación letras (override)', `<select id="ed_dlgAnim" class="${inputCls}">
          <option value="">— La del diseño —</option>
          ${DIALOGUE_ANIMATIONS.map((a) => `<option value="${a.id}" ${curAnim === a.id ? 'selected' : ''}>${escapeHtml(a.label)}</option>`).join('')}
        </select>`)}
      </div>
      <div class="grid grid-cols-2 gap-2">
        ${field(`Tamaño${node.dlgFontSize ? ` (${node.dlgFontSize}px)` : ' (auto)'}`, `<input id="ed_dlgFontSize" type="number" min="0" max="30" placeholder="auto" value="${node.dlgFontSize ?? ''}" class="${inputCls}" />`)}
        ${field('Color texto (override)', `<input id="ed_dlgFontColor" type="color" value="${escapeHtml(node.dlgFontColor ?? '#f1f5f9')}" class="w-full h-[44px] rounded-xl bg-[#0f1428] border border-slate-600 cursor-pointer" />`)}
      </div>
      <label class="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
        <input id="ed_dlgUseColor" type="checkbox" ${node.dlgFontColor ? 'checked' : ''} class="w-4 h-4 accent-fuchsia-400" />
        Usar este color de texto en vez del diseño
      </label>
    </div>`;
}

export function deleteNode(nodeId: string) {
  const node = ctx.state.nodes.find((n) => n.id === nodeId);
  if (!node) return;
  pushHistory();
  ctx.state.nodes = ctx.state.nodes.filter((n) => n.id !== nodeId);
  const removedWires = ctx.state.wires.filter((w) => w.fromNode === nodeId || w.toNode === nodeId).length;
  ctx.state.wires = ctx.state.wires.filter((w) => w.fromNode !== nodeId && w.toNode !== nodeId);
  if ((ctx.state as { startNodeId?: string }).startNodeId === nodeId) {
    (ctx.state as { startNodeId?: string }).startNodeId = ctx.state.nodes[0]?.id ?? '';
    showToast('El nodo inicial se movió al primer nodo ▶');
  }
  if (ctx.selectedNodeId === nodeId) {
    ctx.selectedNodeId = ctx.state.nodes[0]?.id ?? '';
  }
  document.getElementById('drawerModal')?.classList.add('hidden');
  renderNodes();
  showToast(`Nodo eliminado (${removedWires} conexión(es) retirada(s))`);
}

export function duplicateNode(nodeId: string) {
  const node = ctx.state.nodes.find((n) => n.id === nodeId);
  if (!node) return;
  pushHistory();
  const copy = JSON.parse(JSON.stringify(node));
  copy.id = 'node_' + Date.now().toString(36);
  copy.x = (node.x ?? 100) + 40;
  copy.y = (node.y ?? 100) + 40;
  if (copy.badge) copy.badge = `${copy.badge} (copia)`;
  if (copy.title) copy.title = `${copy.title} (copia)`;
  ctx.state.nodes.push(copy);
  ctx.selectedNodeId = copy.id;
  document.getElementById('drawerModal')?.classList.add('hidden');
  renderNodes();
  showToast('Nodo duplicado');
}

function charOptions(selectedId?: string) {
  const catalog = getCharacterCatalog();
  return Object.values(catalog)
    .map((c) => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`)
    .join('');
}

function expressionOptions(selectedCharId?: string, current?: string) {
  const catalog = getCharacterCatalog();
  const all = new Set<string>();
  Object.values(catalog).forEach((c) => (c.expressions || []).forEach((e) => all.add(e)));
  const selChar = catalog[selectedCharId ?? ''];
  const list = selChar?.expressions?.length ? selChar.expressions : [...all];
  return list.map((e) => `<option value="${escapeHtml(e)}" ${e === current ? 'selected' : ''}>${escapeHtml(e)}</option>`).join('');
}

export function openNodeEditor(nodeId: string) {
  const node = ctx.state.nodes.find((n) => n.id === nodeId);
  if (!node) return;
  ctx.selectedNodeId = nodeId;
  renderNodes();

  const modal = document.getElementById('drawerModal');
  const titleEl = document.getElementById('drawerModalTitle');
  const bodyEl = document.getElementById('drawerModalBody');
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = `Editar nodo · ${node.badge || node.title || node.headerBar || node.topTitle || node.id}`;

  const field = (label: string, inner: string) => `
    <label class="block">
      <span class="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">${label}</span>
      ${inner}
    </label>`;
  const inputCls = 'w-full rounded-xl bg-[#0f1428] border border-slate-600 px-3 py-2.5 text-sm text-white focus:border-cyan-400 outline-none min-h-[44px]';
  const typeName =
    node.type === 'banner_scene' ? 'Escena con pancarta' :
    node.type === 'choice' ? 'Decisión / pregunta' :
    node.type === 'character_selector' ? 'Selector de personaje' :
    node.type === 'avatar_scene' ? 'Escena con avatar' :
    node.type === 'video_scene' ? 'Bloque de vídeo' :
    node.type === 'sound_cue' ? 'Complemento de sonido' :
    node.type === 'compact_scene' ? 'Escena compacta' : 'Rama de escena';

  const videoOptions = (selectedId?: string) => {
    const vids = getVideoAssets();
    if (!vids.length) return `<option value="">— Sin vídeos en la carpeta —</option>`;
    return `<option value="">— Elegir vídeo —</option>` + vids
      .map((v) => `<option value="${v.id}" ${v.id === selectedId ? 'selected' : ''}>🎬 ${escapeHtml(v.name)}</option>`)
      .join('');
  };
  const audioOptions = (selectedId?: string) => {
    const auds = getAudioAssets();
    if (!auds.length) return `<option value="">— Sin audios en la carpeta —</option>`;
    return `<option value="">— Sin audio —</option>` + auds
      .map((a) => `<option value="${a.id}" ${a.id === selectedId ? 'selected' : ''}>🎵 ${escapeHtml(a.name)}</option>`)
      .join('');
  };
  const checkRow = (id: string, label: string, checked?: boolean) => `
    <label class="flex items-center gap-2.5 p-3 rounded-xl bg-[#0f1428] border border-slate-700 text-sm text-slate-200 cursor-pointer min-h-[44px]">
      <input id="${id}" type="checkbox" ${checked ? 'checked' : ''} class="w-5 h-5 accent-cyan-400" />
      ${label}
    </label>`;

  let form = `<div class="inline-flex items-center gap-2 mb-1">
      <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-[11px] font-semibold text-cyan-300">${typeName}</span>
      <span class="font-mono text-[11px] text-slate-500">${escapeHtml(node.id)}</span>
    </div>
    <button id="ed_setStart" class="w-full px-4 py-2.5 rounded-xl text-xs font-bold transition min-h-[44px] ${(ctx.state as { startNodeId?: string }).startNodeId === node.id ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-200' : 'bg-slate-800 hover:bg-emerald-500/20 border border-slate-600 text-slate-200'}">
      ${(ctx.state as { startNodeId?: string }).startNodeId === node.id ? '🟢 Este nodo inicia la partida (Jugar empieza aquí)' : '▶ Marcar como nodo inicial de la partida'}
    </button><div class="space-y-3">`;

  if (node.type === 'banner_scene') {
    form += field('Etiqueta superior (badge)', `<input id="ed_badge" class="${inputCls}" value="${escapeHtml(node.badge ?? '')}" />`);
    form += field('Personaje', `<select id="ed_characterId" class="${inputCls}">${charOptions(node.characterId)}</select>`);
    form += `<div class="grid grid-cols-[1fr_auto] gap-2 items-end">
        ${field('Nombre del hablante', `<input id="ed_speaker" class="${inputCls}" value="${escapeHtml(node.speaker ?? '')}" />`)}
        ${field('Color', `<input id="ed_speakerColor" type="color" value="${escapeHtml(node.speakerColor ?? '#ff758c')}" class="w-12 h-[44px] rounded-xl bg-[#0f1428] border border-slate-600 cursor-pointer" />`)}
      </div>`;
    form += field('Pregunta / diálogo', `<textarea id="ed_dialogue" rows="3" class="${inputCls}">${escapeHtml(node.dialogue ?? '')}</textarea>`);
  } else if (node.type === 'choice') {
    form += field('Pregunta', `<input id="ed_title" class="${inputCls}" value="${escapeHtml(node.title ?? '')}" />`);
    form += field('Subtítulo', `<input id="ed_subtitle" class="${inputCls}" value="${escapeHtml(node.subtitle ?? '')}" />`);
    form += `<div class="pt-1">
      <div class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Opciones de respuesta</div>
      <div class="space-y-2" id="ed_optionsList">
        ${(node.options ?? []).map((o, i) => `
          <div class="flex items-center gap-2 p-2 rounded-xl bg-[#0f1428] border border-slate-700" data-opt-row="${i}">
            <input data-opt-label="${i}" class="flex-1 min-w-0 rounded-lg bg-slate-800/80 border border-slate-600 px-2.5 py-2 text-xs text-white min-h-[40px]" value="${escapeHtml(o.label)}" />
            <select data-opt-style="${i}" class="rounded-lg bg-slate-800/80 border border-slate-600 px-1.5 py-2 text-xs text-white">
              <option value="coral" ${o.style === 'coral' ? 'selected' : ''}>Coral</option>
              <option value="teal" ${o.style === 'teal' ? 'selected' : ''}>Turquesa</option>
              <option value="dark" ${(o.style === 'dark' || !o.style) ? 'selected' : ''}>Oscuro</option>
            </select>
            <button data-opt-del="${i}" title="Quitar opción" class="w-9 h-9 shrink-0 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold">×</button>
          </div>`).join('')}
      </div>
      <button id="ed_addOption" class="mt-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 min-h-[44px]">+ Añadir opción</button>
    </div>`;
  } else if (node.type === 'character_selector') {
    form += field('Título', `<input id="ed_title" class="${inputCls}" value="${escapeHtml(node.title ?? '')}" />`);
    form += field('Personaje seleccionado', `<select id="ed_selectedCharId" class="${inputCls}">${charOptions(node.selectedCharId)}</select>`);
    form += field('Expresión', `<select id="ed_expression" class="${inputCls}">${expressionOptions(node.selectedCharId, node.expression)}</select>`);
    form += `<div class="grid grid-cols-2 gap-3">
        ${field(`Tamaño (${node.scale ?? 100}%)`, `<input id="ed_scale" type="range" min="50" max="140" value="${node.scale ?? 100}" class="vn-slider mt-3" />`)}
        ${field(`Posición (${node.position ?? 50}%)`, `<input id="ed_position" type="range" min="10" max="90" value="${node.position ?? 50}" class="vn-slider mt-3" />`)}
      </div>`;
  } else if (node.type === 'avatar_scene') {
    form += field('Título superior', `<input id="ed_topTitle" class="${inputCls}" value="${escapeHtml(node.topTitle ?? '')}" />`);
    form += field('Barra de escena', `<input id="ed_headerBar" class="${inputCls}" value="${escapeHtml(node.headerBar ?? '')}" />`);
    form += field('Personaje', `<select id="ed_characterId" class="${inputCls}">${charOptions(node.characterId)}</select>`);
    form += field('Hablante', `<input id="ed_speaker" class="${inputCls}" value="${escapeHtml(node.speaker ?? '')}" />`);
    form += field('Pregunta / diálogo', `<textarea id="ed_dialogue" rows="3" class="${inputCls}">${escapeHtml(node.dialogue ?? '')}</textarea>`);
    form += field('Audio de la escena (opcional)', `<select id="ed_audioAssetId" class="${inputCls}">${audioOptions(node.audioAssetId)}</select>`);
  } else if (node.type === 'video_scene') {
    form += field('Etiqueta', `<input id="ed_badge" class="${inputCls}" value="${escapeHtml(node.badge ?? 'Vídeo')}" />`);
    form += field('Vídeo (carpeta: galería o archivos)', `<select id="ed_videoAssetId" class="${inputCls}">${videoOptions(node.videoAssetId)}</select>`);
    form += field('Texto mientras se reproduce', `<textarea id="ed_dialogue" rows="2" class="${inputCls}">${escapeHtml(node.dialogue ?? '')}</textarea>`);
    form += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${checkRow('ed_videoAutoplay', '▶ Reproducir automáticamente', node.videoAutoplay !== false)}
        ${checkRow('ed_videoLoop', '🔁 Repetir en bucle', !!node.videoLoop)}
        ${checkRow('ed_videoMuted', '🔇 Empezar silenciado', !!node.videoMuted)}
        ${checkRow('ed_videoControls', '🎛 Mostrar controles', node.videoControls !== false)}
      </div>`;
    form += field('Audio extra (opcional)', `<select id="ed_audioAssetId" class="${inputCls}">${audioOptions(node.audioAssetId)}</select>`);
  } else if (node.type === 'sound_cue') {
    form += field('Etiqueta', `<input id="ed_badge" class="${inputCls}" value="${escapeHtml(node.badge ?? '🔊 Sonido')}" />`);
    form += field('Sonido (carpeta: archivos o audio)', `<select id="ed_soundAssetId" class="${inputCls}">${audioOptions(node.soundAssetId || node.audioAssetId)}</select>`);
    form += field(`Volumen (${node.volume ?? 100}%)`, `<input id="ed_volume" type="range" min="0" max="100" value="${node.volume ?? 100}" class="vn-slider mt-3" />`);
    form += checkRow('ed_loop', '🔁 Repetir mientras dure el paso', !!node.loop);
    form += field('Nota (no bloquea la historia)', `<textarea id="ed_dialogue" rows="2" class="${inputCls}">${escapeHtml(node.dialogue ?? '')}</textarea>`);
  } else {
    // compact_scene + branch_scene
    if (node.title !== undefined) form += field('Título', `<input id="ed_title" class="${inputCls}" value="${escapeHtml(node.title ?? '')}" />`);
    if (node.headerBar !== undefined) form += field('Barra de escena', `<input id="ed_headerBar" class="${inputCls}" value="${escapeHtml(node.headerBar ?? '')}" />`);
    if (node.characterId !== undefined) form += field('Personaje', `<select id="ed_characterId" class="${inputCls}">${charOptions(node.characterId)}</select>`);
    if (node.speaker !== undefined) form += field('Hablante', `<input id="ed_speaker" class="${inputCls}" value="${escapeHtml(node.speaker ?? '')}" />`);
    form += field('Pregunta / diálogo', `<textarea id="ed_dialogue" rows="3" class="${inputCls}">${escapeHtml(node.dialogue ?? '')}</textarea>`);
  }

  form += dialogueStyleFields(node, inputCls, field);

  form += `</div>
    <div class="flex flex-wrap justify-between gap-2 pt-4 mt-2 border-t border-slate-700/60">
      <div class="flex gap-2">
        <button id="ed_duplicate" class="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-xs font-semibold text-slate-200 min-h-[44px]">⧉ Duplicar</button>
        <button id="ed_delete" class="px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/50 text-xs font-bold text-rose-300 min-h-[44px]">🗑 Eliminar nodo</button>
      </div>
      <div class="flex gap-2">
        <button id="ed_cancel" class="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 min-h-[44px]">Cancelar</button>
        <button id="ed_save" class="px-5 py-2.5 rounded-xl bg-cyan-500 text-xs font-bold text-slate-950 min-h-[44px]">Guardar</button>
      </div>
    </div>
    <p class="text-[11px] text-slate-500 pt-1">Consejo: también puedes dar doble-clic / doble-toque en cualquier texto del nodo para editarlo rápido.</p>`;

  bodyEl.innerHTML = form;
  modal.classList.remove('hidden');

  const $ = (id: string) => document.getElementById(id);
  $('ed_cancel')!.onclick = () => modal.classList.add('hidden');
  $('ed_delete')!.onclick = () => {
    if (confirm(`¿Eliminar este nodo (${node.type}) y sus conexiones?`)) deleteNode(node.id);
  };
  $('ed_duplicate')!.onclick = () => duplicateNode(node.id);
  const setStartBtn = $('ed_setStart');
  if (setStartBtn) setStartBtn.onclick = () => {
    pushHistory();
    setStartNodeId(node.id);
    openNodeEditor(node.id);
  };

  const addBtn = $('ed_addOption');
  if (addBtn) addBtn.onclick = () => {
    pushHistory();
    node.options = node.options ?? [];
    const n = node.options.length + 1;
    node.options.push({
      id: 'opt_' + Date.now().toString(36),
      label: `Opción ${n}: «Rama nueva»`,
      style: n % 2 === 0 ? 'teal' : 'coral',
      inColor: 'cyan',
      outColor: n % 2 === 0 ? 'cyan' : 'coral'
    });
    openNodeEditor(node.id);
  };
  bodyEl.querySelectorAll('[data-opt-del]').forEach((btn) => {
    (btn as HTMLElement).onclick = () => {
      pushHistory();
      node.options.splice(Number((btn as HTMLElement).dataset.optDel), 1);
      openNodeEditor(node.id);
    };
  });
  const selChar = $('ed_selectedCharId') as HTMLSelectElement | null;
  if (selChar) selChar.onchange = () => {
    const catalog = getCharacterCatalog();
    const c = catalog[selChar.value];
    const exprSel = $('ed_expression') as HTMLSelectElement | null;
    if (c && exprSel) {
      exprSel.innerHTML = c.expressions.map((e) => `<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`).join('');
    }
  };

  const openDlgBtn = $('ed_openDlgStudio');
  if (openDlgBtn) openDlgBtn.onclick = (e) => {
    e.preventDefault();
    openDialogueStudio();
  };

  $('ed_save')!.onclick = () => {
    pushHistory();
    const val = (id: string) => ($(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null)?.value;
    if ($('ed_badge')) node.badge = val('ed_badge')!;
    if ($('ed_title')) node.title = val('ed_title')!;
    if ($('ed_subtitle')) node.subtitle = val('ed_subtitle')!;
    if ($('ed_headerBar')) node.headerBar = val('ed_headerBar')!;
    if ($('ed_topTitle')) node.topTitle = val('ed_topTitle')!;
    if ($('ed_dialogue')) node.dialogue = val('ed_dialogue')!;
    if ($('ed_speaker')) node.speaker = val('ed_speaker')!;
    if ($('ed_speakerColor')) node.speakerColor = (val('ed_speakerColor') as string);
    const charSel = $('ed_characterId') as HTMLSelectElement | null;
    if (charSel) {
      node.characterId = charSel.value;
      const catalog = getCharacterCatalog();
      if (catalog[charSel.value] && !node.speaker) node.speaker = catalog[charSel.value].name;
    }
    const selCharSave = $('ed_selectedCharId') as HTMLSelectElement | null;
    if (selCharSave) {
      node.selectedCharId = selCharSave.value;
      const catalog = getCharacterCatalog();
      const exprSel = $('ed_expression') as HTMLSelectElement | null;
      node.expression = exprSel?.value ?? catalog[selCharSave.value]?.expressions[0] ?? node.expression;
    } else if ($('ed_expression')) node.expression = val('ed_expression')!;
    if ($('ed_scale')) node.scale = Number(val('ed_scale'));
    if ($('ed_position')) node.position = Number(val('ed_position'));
    // Bloque de vídeo
    if ($('ed_videoAssetId')) {
      const vid = val('ed_videoAssetId')!;
      node.videoAssetId = vid || undefined;
      const found = findCustomAsset(vid);
      node.videoName = found?.name;
    }
    const boolOf = (id: string) => ($(id) as HTMLInputElement | null)?.checked;
    if ($('ed_videoAutoplay')) node.videoAutoplay = !!boolOf('ed_videoAutoplay');
    if ($('ed_videoLoop')) node.videoLoop = !!boolOf('ed_videoLoop');
    if ($('ed_videoMuted')) node.videoMuted = !!boolOf('ed_videoMuted');
    if ($('ed_videoControls')) node.videoControls = !!boolOf('ed_videoControls');
    if ($('ed_audioAssetId')) {
      const aid = val('ed_audioAssetId')!;
      node.audioAssetId = aid || undefined;
      const found = findCustomAsset(aid);
      node.audioName = found?.name;
    }
    // Complemento de sonido
    if ($('ed_soundAssetId')) {
      const sid = val('ed_soundAssetId')!;
      node.soundAssetId = sid || undefined;
      node.audioAssetId = sid || undefined;
      const found = findCustomAsset(sid);
      node.soundName = found?.name;
      node.audioName = found?.name;
    }
    if ($('ed_volume')) node.volume = Number(val('ed_volume'));
    if ($('ed_loop')) node.loop = !!boolOf('ed_loop');
    // Cuadro de diálogo personalizado por nodo
    if ($('ed_dlgTheme')) {
      const t = val('ed_dlgTheme')!;
      node.dlgThemeId = t === 'global' ? undefined : t;
    }
    if ($('ed_dlgFont')) node.dlgFont = val('ed_dlgFont')! || undefined;
    if ($('ed_dlgAnim')) node.dlgAnimation = (val('ed_dlgAnim')! || undefined) as any;
    if ($('ed_dlgFontSize')) {
      const n = Number(val('ed_dlgFontSize'));
      node.dlgFontSize = Number.isFinite(n) && n > 0 ? n : undefined;
    }
    if ($('ed_dlgFontColor')) {
      const useColor = ($('ed_dlgUseColor') as HTMLInputElement | null)?.checked;
      node.dlgFontColor = useColor ? (val('ed_dlgFontColor') as string) : undefined;
    }
    // Opciones de choice
    bodyEl.querySelectorAll('[data-opt-label]').forEach((inp) => {
      const i = Number((inp as HTMLElement).dataset.optLabel);
      if (node.options?.[i]) node.options[i].label = (inp as HTMLInputElement).value;
    });
    bodyEl.querySelectorAll('[data-opt-style]').forEach((sel) => {
      const i = Number((sel as HTMLElement).dataset.optStyle);
      if (node.options?.[i]) {
        node.options[i].style = (sel as HTMLSelectElement).value;
        node.options[i].outColor = (sel as HTMLSelectElement).value === 'coral' ? 'coral' : 'cyan';
      }
    });
    modal.classList.add('hidden');
    renderNodes();
    showToast('Nodo actualizado ✏️');
  };
}
