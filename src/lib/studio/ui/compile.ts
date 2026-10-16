// @ts-nocheck
// Compilador de novelas: exportador completo a .html + paquetes funcionales
// Windows (.exe vía bundle + lanzador inmediato) y Linux (lanzadores + bundle).
// Unifica el generador standalone (antes duplicado en exporter.ts y share.ts).
// Ver docs/ARCHITECTURE.md y el plan de "Compilar tus novelas".
import { ctx } from '../context';
import { playSynthSfx } from '../domain/audio';
import { escapeHtml } from '../domain/geometry';
import { showToast } from './toast';
import { getStartNodeId } from '../storage';
import { getCharacterCatalog, getCustomAssets } from '../../assets';
import { CHARACTER_ASSETS } from '../data/assets';
import { DIALOGUE_FONTS, dialogueAnimationCss, getAllDialogueThemes, getProjectDialogueThemeId } from '../../dialogue-themes';

export type CompileFormat = 'html' | 'vnjson' | 'windows' | 'linux';

export interface StoryIssue {
  level: 'error' | 'aviso';
  msg: string;
}

/** Nombre de archivo seguro a partir del título del proyecto. */
export function sanitizeFileStem(name: string, fallback = 'Mi_Novela'): string {
  const clean = (name ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 48);
  return clean || fallback;
}

/** Valida el grafo antes de compilar: errores bloquean, avisos no. */
export function validateStory(): StoryIssue[] {
  const issues: StoryIssue[] = [];
  const nodes = ctx.state?.nodes ?? [];
  const wires = ctx.state?.wires ?? [];
  if (!nodes.length) {
    issues.push({ level: 'error', msg: 'La historia no tiene nodos: añade al menos una escena.' });
    return issues;
  }
  const ids = new Set(nodes.map((n) => n.id));
  const startId = getStartNodeId(ctx.state);
  if (!startId || !ids.has(startId)) {
    issues.push({ level: 'error', msg: 'No hay nodo inicial válido (se usará la primera escena).' });
  }
  const customs = new Map(getCustomAssets().map((a) => [a.id, a]));
  const outOf = (id: string) => wires.filter((w) => w.fromNode === id);
  const reachable = new Set<string>();
  if (startId && ids.has(startId)) {
    const queue = [startId];
    reachable.add(startId);
    while (queue.length) {
      const cur = queue.pop();
      for (const w of outOf(cur)) {
        if (ids.has(w.toNode) && !reachable.has(w.toNode)) {
          reachable.add(w.toNode);
          queue.push(w.toNode);
        }
      }
    }
    for (const n of nodes) {
      if (!reachable.has(n.id)) {
        const label = n.badge || n.headerBar || n.title || n.id;
        issues.push({ level: 'aviso', msg: `«${label}» es inalcanzable desde el inicio (quedará fuera del camino principal).` });
      }
    }
  }
  for (const n of nodes) {
    const label = n.badge || n.headerBar || n.title || n.id;
    if (n.type === 'choice') {
      if (!n.options?.length) {
        issues.push({ level: 'error', msg: `«${label}» es de decisión pero no tiene opciones.` });
      } else {
        for (const o of n.options) {
          if (!outOf(n.id).some((w) => w.fromPort === `out_${o.id}`)) {
            issues.push({ level: 'aviso', msg: `«${label}» → «${o.label}» no tiene cable de salida (mostrará fin de rama).` });
          }
        }
      }
    } else if (!outOf(n.id).length) {
      // Un solo final sin salida es normal; varios huérfanos intermedios avisan.
      const outs = outOf(n.id).length;
      if (outs === 0 && reachable.size > 1 && n.id !== startId && nodes.length > 1) {
        // Solo avisa si el nodo tiene entradas (es un final prematuro en mitad del grafo).
        const hasIn = wires.some((w) => w.toNode === n.id);
        if (hasIn && ![...reachable].every((id) => id === n.id)) {
          issues.push({ level: 'aviso', msg: `«${label}» no tiene salida (será un final de rama).` });
        }
      }
    }
    if (n.type === 'video_scene' && !n.videoAssetId) {
      issues.push({ level: 'aviso', msg: `«${label}» es de vídeo pero no tiene recurso asignado.` });
    }
    if (n.type === 'sound_cue' && !(n.soundAssetId || n.audioAssetId)) {
      issues.push({ level: 'aviso', msg: `«${label}» es de sonido pero no tiene audio asignado.` });
    }
    for (const ref of [n.videoAssetId, n.soundAssetId, n.audioAssetId]) {
      if (ref && !customs.has(ref)) {
        issues.push({ level: 'error', msg: `«${label}» usa un recurso eliminado (${String(ref).slice(0, 24)}…). Reasígnalo.` });
        break;
      }
    }
    if (n.type !== 'choice' && n.type !== 'character_selector' && !(n.dialogue ?? '').trim()) {
      issues.push({ level: 'aviso', msg: `«${label}» no tiene diálogo (saldrá vacío).` });
    }
  }
  for (const w of wires) {
    if (!ids.has(w.fromNode) || !ids.has(w.toNode)) {
      issues.push({ level: 'error', msg: `Hay un cable roto (${w.fromNode} → ${w.toNode}). Bórralo y reconecta.` });
      break;
    }
  }
  return issues;
}

/** Formato portable historia.vn.json (base para los 3 destinos). */
export function buildHistoria(): Record<string, unknown> {
  const catalog = getCharacterCatalog();
  const customs: Record<string, unknown> = {};
  for (const a of getCustomAssets()) {
    customs[a.id] = { dataUrl: a.dataUrl, mime: a.mime, kind: a.kind, name: a.name };
  }
  return {
    v: 1,
    proyecto: ctx.state.projectName || 'Mi Novela',
    startNodeId: getStartNodeId(ctx.state),
    nodes: ctx.state.nodes,
    wires: ctx.state.wires,
    variables: ctx.state.variables ?? {},
    dialogueThemeId: getProjectDialogueThemeId(ctx.state),
    dialogueThemes: getAllDialogueThemes(),
    assets: { catalog, customs }
  };
}

/** Solo los assets usados (el .html pesa menos que incrustando todo el catálogo). */
function collectUsedPayload(): { nodes: unknown[]; wires: unknown[]; assets: Record<string, unknown>; customs: Record<string, unknown>; dialogueThemes: Record<string, unknown>; dialogueThemeId: string } {
  const fullCatalog = getCharacterCatalog();
  const fallback = fullCatalog.sora ?? CHARACTER_ASSETS.sora;
  const usedChars = new Set<string>();
  for (const n of ctx.state.nodes) {
    if (n.characterId) usedChars.add(n.characterId);
    if (n.selectedCharId) usedChars.add(n.selectedCharId);
  }
  usedChars.add('sora');
  const assets: Record<string, unknown> = {};
  for (const id of usedChars) {
    if (fullCatalog[id]) assets[id] = fullCatalog[id];
  }
  if (!assets.sora && fallback) assets.sora = fallback;
  const customsAll = new Map(getCustomAssets().map((a) => [a.id, a]));
  const customs: Record<string, unknown> = {};
  for (const n of ctx.state.nodes) {
    for (const ref of [n.videoAssetId, n.soundAssetId, n.audioAssetId]) {
      const a = ref ? customsAll.get(ref) : undefined;
      if (a) customs[a.id] = { dataUrl: a.dataUrl, mime: a.mime, kind: a.kind, name: a.name };
    }
    // Sprites personalizados usados como personaje (viven en customs como imagen).
    for (const ref of [n.characterId, n.selectedCharId]) {
      const a = ref ? customsAll.get(ref) : undefined;
      if (a && a.kind === 'imagen') {
        assets[a.id] = { id: a.id, name: a.name, color: '#22d3ee', avatar: a.dataUrl, banner: a.dataUrl, expressions: ['Personalizado'], custom: true };
      }
    }
  }
  // Solo los diseños de diálogo usados (global + overrides por nodo).
  const allThemes = new Map(getAllDialogueThemes().map((t) => [t.id, t]));
  const dialogueThemeId = getProjectDialogueThemeId(ctx.state);
  const usedThemeIds = new Set<string>([dialogueThemeId]);
  for (const n of ctx.state.nodes) {
    if (n.dlgThemeId && n.dlgThemeId !== 'global') usedThemeIds.add(n.dlgThemeId);
  }
  const dialogueThemes = {};
  for (const id of usedThemeIds) {
    const t = allThemes.get(id);
    if (t) dialogueThemes[id] = t;
  }
  // Garantiza al menos el tema global aunque la biblioteca haya cambiado.
  if (!dialogueThemes[dialogueThemeId] && allThemes.get(dialogueThemeId)) {
    dialogueThemes[dialogueThemeId] = allThemes.get(dialogueThemeId);
  }
  return { nodes: ctx.state.nodes, wires: ctx.state.wires, assets, customs, dialogueThemes, dialogueThemeId };
}

/**
 * Generador standalone ÚNICO: novela jugable autocontenida (file://, sin servidor).
 * Incluye startNodeId, variables, audio/vídeo, decisiones y reinicio.
 */
export function buildStandaloneHtml(): string {
  const startId = getStartNodeId(ctx.state);
  const project = ctx.state.projectName || 'Mi Novela';
  const { nodes, wires, assets, customs, dialogueThemes, dialogueThemeId } = collectUsedPayload();
  const fontStacks: Record<string, string> = {};
  for (const f of DIALOGUE_FONTS) fontStacks[f.id] = f.stack;
  const serialized = JSON.stringify({
    proyecto: project,
    startNodeId: startId,
    variables: ctx.state.variables ?? {},
    nodes,
    wires,
    assets,
    customs,
    dialogueThemes,
    dialogueThemeId,
    fontStacks
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${escapeHtml(project)} — Novela visual jugable</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background:#0b0f1f; color:#fff; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:12px; }
  .stage { width:min(960px, 96vw); min-height:min(600px, 94vh); background:radial-gradient(circle at 50% 28%, #263566, #0b0f1f); border:2px solid #00f2fe; border-radius:20px; display:flex; flex-direction:column; gap:12px; padding:20px; box-shadow:0 0 40px rgba(0,242,254,0.25); }
  .top { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; }
  .title { font-weight:800; font-size:18px; }
  .meta { font-size:12px; color:#94a3b8; }
  .rowbtns { display:flex; gap:8px; }
  .ghost { background:transparent; border:1px solid #475569; color:#e2e8f0; padding:8px 12px; border-radius:10px; cursor:pointer; font-weight:600; font-size:12px; }
  .ghost:hover { border-color:#00f2fe; color:#fff; }
  .media { display:flex; justify-content:center; }
  .sprite { max-height:250px; max-width:100%; border-radius:16px; border:2px solid rgba(255,255,255,0.25); }
  .vplayer { max-width:100%; max-height:250px; border-radius:16px; border:2px solid rgba(232,121,249,0.5); background:#000; }
  .box { background:rgba(15,20,40,0.92); border:1px solid rgba(0,242,254,0.45); border-radius:16px; padding:18px; background-size:cover; background-position:center; }
  .speaker { font-weight:800; color:#ff758c; margin-bottom:6px; }
  .dlg { white-space:pre-wrap; line-height:1.55; }
${dialogueAnimationCss()}
  .vars { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
  .vars span { font-size:11px; padding:2px 8px; border-radius:999px; background:#1e293b; color:#67e8f9; font-family:ui-monospace,monospace; }
  .choices { display:flex; flex-direction:column; gap:10px; margin-top:12px; }
  .btn { background:#1e294b; color:#fff; border:1px solid #00f2fe; padding:12px 16px; border-radius:12px; cursor:pointer; font-weight:700; font-size:14px; min-height:44px; }
  .btn:hover { background:#00f2fe; color:#0b0f1f; }
  .end { margin-top:12px; padding:12px; border-radius:12px; background:rgba(0,242,254,0.08); border:1px dashed rgba(0,242,254,0.5); font-size:13px; color:#a5f3fc; }
  @media (max-width:560px){ .stage{ padding:14px; } .title{ font-size:16px; } }
</style>
</head>
<body>
<main class="stage">
  <div class="top">
    <div><div class="title" id="t"></div><div class="meta" id="m"></div></div>
    <div class="rowbtns"><button class="ghost" id="restart">↻ Reiniciar</button></div>
  </div>
  <div class="media"><img id="sp" class="sprite" alt="Personaje" /></div>
  <div class="media"><video id="vp" class="vplayer" controls playsinline style="display:none"></video></div>
  <audio id="ap" style="display:none"></audio>
  <div class="box" id="dlgBox">
    <div id="spk" class="speaker"></div>
    <div id="dlg" class="dlg vn-dlg-letters"></div>
    <div id="ch" class="choices"></div>
    <div id="end" class="end" style="display:none"></div>
    <div id="vars" class="vars"></div>
  </div>
</main>
<script>
var DATA = ${serialized};
var START = (DATA.startNodeId && DATA.nodes.some(function(n){return n.id===DATA.startNodeId;})) ? DATA.startNodeId : (DATA.nodes[0] && DATA.nodes[0].id);
var visited = 0;
function esc(s){ return String(s == null ? "" : s); }
function go(id) {
  var n = null;
  for (var i=0;i<DATA.nodes.length;i++){ if (DATA.nodes[i].id===id){ n=DATA.nodes[i]; break; } }
  if (!n) n = DATA.nodes[0];
  if (!n) return;
  visited++;
  var catalog = DATA.assets || {};
  var c = catalog[n.characterId || n.selectedCharId || "sora"] || catalog.sora || { name:"", avatar:"" };
  var sp = document.getElementById("sp");
  var vp = document.getElementById("vp");
  var ap = document.getElementById("ap");
  try { vp.pause(); } catch(e){}
  vp.style.display = "none"; vp.removeAttribute("src"); sp.style.display = "";
  try { ap.pause(); } catch(e){}
  function customOf(id){ return (DATA.customs || {})[id]; }
  var label = n.badge || n.headerBar || n.title || n.topTitle || DATA.proyecto || "Novela";
  document.getElementById("t").textContent = DATA.proyecto || "Novela";
  document.getElementById("m").textContent = label + " · paso " + visited;
  if (n.type === "video_scene") {
    var v = customOf(n.videoAssetId);
    if (v && v.dataUrl) {
      sp.style.display = "none"; vp.style.display = "";
      vp.src = v.dataUrl; vp.loop = !!n.videoLoop; vp.muted = !!n.videoMuted;
      vp.controls = n.videoControls !== false;
      if (n.videoAutoplay !== false) { var p = vp.play(); if (p && p.catch) p.catch(function(){}); }
      document.getElementById("spk").textContent = n.videoName || v.name || "Vídeo";
      document.getElementById("spk").style.color = "#e879f9";
    } else {
      document.getElementById("spk").textContent = "🎬 Sin vídeo asignado";
      document.getElementById("spk").style.color = "#e879f9";
    }
  } else {
    if (c.avatar) { sp.src = c.avatar; sp.style.display = ""; }
    else { sp.style.display = "none"; }
    var spkName = (n.type === "sound_cue") ? (n.soundName || n.audioName || "🔊 Sonido") : (n.speaker || c.name || "");
    document.getElementById("spk").textContent = spkName;
    document.getElementById("spk").style.color = (n.type === "sound_cue") ? "#fbbf24" : (n.speakerColor || c.color || "#ff758c");
  }
  var sndId = (n.type === "sound_cue") ? (n.soundAssetId || n.audioAssetId) : n.audioAssetId;
  if (sndId) {
    var s = customOf(sndId);
    if (s && s.dataUrl) {
      ap.src = s.dataUrl; ap.loop = !!n.loop;
      try { ap.volume = Math.max(0, Math.min(1, ((n.volume == null ? 100 : n.volume)) / 100)); } catch(e){}
      var q = ap.play(); if (q && q.catch) q.catch(function(){});
    }
  }
  document.getElementById("dlg").textContent = "";
  (function applyDialogue(n) {
    var themes = DATA.dialogueThemes || {};
    var ids = Object.keys(themes);
    var fallback = ids.length ? themes[ids[0]] : null;
    var t = (n.dlgThemeId && themes[n.dlgThemeId]) ? themes[n.dlgThemeId] : (themes[DATA.dialogueThemeId] || fallback);
    if (!t) t = { boxColor:"#0f1428", boxImage:"", borderColor:"#00f2fe", borderWidth:1, borderRadius:16, font:"novela-sans", fontSize:16, fontColor:"#fff", speakerColor:"#ff758c", animation:"typewriter", animSpeed:1 };
    if (n.dlgFont) t = Object.assign({}, t, { font: n.dlgFont });
    if (n.dlgAnimation) t = Object.assign({}, t, { animation: n.dlgAnimation });
    if (typeof n.dlgFontSize === "number" && n.dlgFontSize > 0) t = Object.assign({}, t, { fontSize: n.dlgFontSize });
    if (n.dlgFontColor) t = Object.assign({}, t, { fontColor: n.dlgFontColor });
    var stacks = DATA.fontStacks || {};
    var stack = stacks[t.font] || t.font || "system-ui,sans-serif";
    var box = document.getElementById("dlgBox");
    if (box) {
      box.style.backgroundColor = t.boxColor || "#0f1428";
      box.style.backgroundImage = t.boxImage ? ("url(\"" + t.boxImage + "\")") : "";
      box.style.backgroundSize = "cover";
      box.style.backgroundPosition = "center";
      box.style.borderColor = t.borderColor || "#00f2fe";
      box.style.borderWidth = (t.borderWidth == null ? 1 : t.borderWidth) + "px";
      box.style.borderRadius = (t.borderRadius == null ? 16 : t.borderRadius) + "px";
    }
    var spk = document.getElementById("spk");
    if (spk) { spk.style.fontFamily = stack; if (!n.speakerColor) spk.style.color = t.speakerColor || "#ff758c"; }
    var dlg = document.getElementById("dlg");
    var full = (n.type === "choice") ? "Elige tu próxima decisión:" : (n.dialogue || n.title || "…");
    dlg.style.fontFamily = stack;
    dlg.style.fontSize = (t.fontSize || 16) + "px";
    dlg.style.color = t.fontColor || "#fff";
    dlg.className = "dlg vn-dlg-letters";
    if (window.__dlgTimer) { clearInterval(window.__dlgTimer); window.__dlgTimer = null; }
    var anim = t.animation || "none";
    var speed = Math.max(0.25, Number(t.animSpeed) || 1);
    if (anim === "none") { dlg.textContent = full; return; }
    if (anim === "typewriter") {
      dlg.textContent = "";
      var i = 0;
      var step = Math.max(1, Math.round(speed));
      window.__dlgTimer = setInterval(function(){
        i += step;
        dlg.textContent = full.slice(0, i);
        if (i >= full.length) { clearInterval(window.__dlgTimer); window.__dlgTimer = null; }
      }, Math.max(8, Math.round(34 / speed)));
      dlg.onclick = function(){
        if (window.__dlgTimer) { clearInterval(window.__dlgTimer); window.__dlgTimer = null; dlg.textContent = full; }
      };
      return;
    }
    dlg.innerHTML = "";
    dlg.classList.add("vn-dlg-anim-" + anim);
    var per = (anim === "wave" || anim === "rainbow") ? 0.06 : 0.028 / speed;
    for (var k = 0; k < full.length; k++) {
      var s = document.createElement("span");
      s.textContent = full[k];
      s.style.animationDelay = (k * per).toFixed(3) + "s";
      dlg.appendChild(s);
    }
  })(n);
  var varsEl = document.getElementById("vars");
  varsEl.innerHTML = "";
  var vars = DATA.variables || {};
  Object.keys(vars).forEach(function(k){
    var s = document.createElement("span");
    s.textContent = k + ": " + String(vars[k]);
    varsEl.appendChild(s);
  });
  var ch = document.getElementById("ch");
  ch.innerHTML = "";
  var end = document.getElementById("end");
  end.style.display = "none"; end.textContent = "";
  var outs = DATA.wires.filter(function(w){ return w.fromNode === n.id; });
  if (n.type === "choice" && n.options && n.options.length) {
    n.options.forEach(function(o){
      var w = null;
      for (var i=0;i<outs.length;i++){ if (outs[i].fromPort === "out_" + o.id){ w = outs[i]; break; } }
      var b = document.createElement("button");
      b.className = "btn"; b.textContent = o.label;
      b.onclick = function(){
        if (w) go(w.toNode);
        else { end.style.display = ""; end.textContent = "[Elegido: " + o.label + "] — Fin de esta rama. Conecta un cable de salida en el editor para continuar."; }
      };
      ch.appendChild(b);
    });
  } else if (outs.length) {
    var b = document.createElement("button");
    b.className = "btn"; b.textContent = "Continuar →";
    b.onclick = function(){ go(outs[0].toNode); };
    ch.appendChild(b);
    document.onkeydown = function(e){
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(outs[0].toNode); }
    };
  } else {
    end.style.display = "";
    end.textContent = "✦ Fin de esta rama — ¡gracias por jugar! Pulsa ↻ Reiniciar para volver al inicio.";
    document.onkeydown = null;
  }
}
document.getElementById("restart").onclick = function(){ visited = 0; go(START); };
go(START);
<\/script>
</body>
</html>`;
}

/** Tamaño estimado en bytes del HTML standalone (sin generarlo dos veces si ya lo tienes). */
export function estimateStandaloneBytes(cached?: string): number {
  try {
    const html = cached ?? buildStandaloneHtml();
    return new Blob([html]).size;
  } catch {
    return 0;
  }
}

export function formatBytes(n: number): string {
  if (!n || n <= 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** Guardado multiplataforma: Tauri (diálogo nativo) → Capacitor (Share) → web (descarga). */
export async function saveTextFile(filename: string, content: string, mime = 'text/plain'): Promise<boolean> {
  // Tauri (PC): diálogo nativo real.
  try {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const ext = (filename.split('.').pop() || '').toLowerCase();
      const path = await save({ defaultPath: filename, filters: [{ name: 'Novela', extensions: [ext || '*'] }] });
      if (!path) return false;
      await writeTextFile(path, content);
      return true;
    }
  } catch {}
  // Capacitor (móvil): guarda en caché y abre el Share sheet.
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (cap?.isNativePlatform?.()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      const data = btoa(unescape(encodeURIComponent(content)));
      const res = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache });
      await Share.share({ title: filename, url: res.uri, dialogTitle: 'Compartir exportación' });
      return true;
    }
  } catch {}
  try {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Exporta la novela jugable .html (validación + guardado nativo). */
export async function exportStandaloneHtmlFile(): Promise<boolean> {
  playSynthSfx('connect');
  const issues = validateStory();
  if (issues.some((i) => i.level === 'error')) {
    showToast(`No se puede compilar: ${issues.find((i) => i.level === 'error').msg}`);
    return false;
  }
  const stem = sanitizeFileStem(ctx.state.projectName);
  const html = buildStandaloneHtml();
  const ok = await saveTextFile(`${stem}_Web.html`, html, 'text/html');
  try {
    (window as unknown as { __lastStandaloneHtml?: string }).__lastStandaloneHtml = html;
  } catch {}
  showToast(ok ? `¡Novela web autónoma (.html) exportada! (${formatBytes(new Blob([html]).size)})` : 'No se pudo guardar el .html');
  return ok;
}

/** Exporta el formato portable historia.vn.json. */
export async function exportHistoriaJson(): Promise<boolean> {
  playSynthSfx('connect');
  const stem = sanitizeFileStem(ctx.state.projectName);
  const json = JSON.stringify(buildHistoria(), null, 2);
  const ok = await saveTextFile(`${stem}.vn.json`, json, 'application/json');
  showToast(ok ? 'Historia portable (.vn.json) exportada 📦' : 'No se pudo guardar el .vn.json');
  return ok;
}

function windowsBatFor(htmlFile: string, project: string): string {
  return `@echo off\r\nrem ${project} — lanzador Windows (doble clic para jugar)\r\nrem Este .bat abre la novela jugable en tu navegador predeterminado.\r\nstart "" "%~dp0${htmlFile}"\r\n`;
}

function linuxShFor(htmlFile: string, project: string): string {
  return `#!/bin/sh\n# ${project} — lanzador Linux (dale permiso de ejecución una vez: chmod +x)\nHERE="$(dirname "$0")"\nif command -v xdg-open >/dev/null 2>&1; then\n  xdg-open "$HERE/${htmlFile}" &\nelse\n  echo "Abre este archivo en tu navegador: $HERE/${htmlFile}"\nfi\n`;
}

function linuxDesktopFor(shFile: string, project: string): string {
  const safe = project.replace(/;/g, ',');
  return `[Desktop Entry]\nType=Application\nName=${safe}\nComment=Novela visual jugable (abre el lanzador .sh)\nExec=sh -c 'xdg-open "$(dirname %k)" &'\nTerminal=false\nCategories=Game;\n`;
}

/**
 * Paquete Windows FUNCIONAL: descarga la novela .html jugable + su lanzador .bat.
 * (Antes solo se descargaba el .bat sin el .html: no funcionaba.)
 * El .exe nativo real se obtiene con el workflow manual «Bundle escritorio».
 */
export async function exportWindowsPackage(status?: (msg: string) => void): Promise<boolean> {
  playSynthSfx('connect');
  const issues = validateStory();
  if (issues.some((i) => i.level === 'error')) {
    showToast(`No se puede compilar: ${issues.find((i) => i.level === 'error').msg}`);
    return false;
  }
  const stem = sanitizeFileStem(ctx.state.projectName);
  const htmlFile = `${stem}_Web.html`;
  const batFile = `Iniciar_${stem}.bat`;
  status?.('Generando novela jugable…');
  await sleep(120);
  const html = buildStandaloneHtml();
  try {
    (window as unknown as { __lastStandaloneHtml?: string }).__lastStandaloneHtml = html;
  } catch {}
  status?.('Guardando .html jugable…');
  const okHtml = await saveTextFile(htmlFile, html, 'text/html');
  if (!okHtml) return false;
  await sleep(350); // deja que el navegador registre la primera descarga
  status?.('Guardando lanzador de Windows…');
  const okBat = await saveTextFile(batFile, windowsBatFor(htmlFile, ctx.state.projectName || 'Mi Novela'), 'application/bat');
  showToast(
    okBat
      ? 'Paquete Windows listo: abre el .bat para jugar 🎮 (el .exe nativo sale del workflow «Bundle escritorio»)'
      : 'Se descargó el .html; el lanzador .bat no se pudo guardar'
  );
  return okHtml && okBat;
}

/**
 * Paquete Linux FUNCIONAL: .html jugable + lanzador .sh ejecutable + acceso .desktop.
 * El .AppImage/.deb nativo real se obtiene con el workflow manual «Bundle escritorio».
 */
export async function exportLinuxPackage(status?: (msg: string) => void): Promise<boolean> {
  playSynthSfx('connect');
  const issues = validateStory();
  if (issues.some((i) => i.level === 'error')) {
    showToast(`No se puede compilar: ${issues.find((i) => i.level === 'error').msg}`);
    return false;
  }
  const stem = sanitizeFileStem(ctx.state.projectName);
  const project = ctx.state.projectName || 'Mi Novela';
  const htmlFile = `${stem}_Web.html`;
  const shFile = `jugar-${stem.toLowerCase()}.sh`;
  const desktopFile = `${stem.toLowerCase()}.desktop`;
  status?.('Generando novela jugable…');
  await sleep(120);
  const html = buildStandaloneHtml();
  try {
    (window as unknown as { __lastStandaloneHtml?: string }).__lastStandaloneHtml = html;
  } catch {}
  status?.('Guardando .html jugable…');
  if (!(await saveTextFile(htmlFile, html, 'text/html'))) return false;
  await sleep(350);
  status?.('Guardando lanzador Linux (.sh)…');
  if (!(await saveTextFile(shFile, linuxShFor(htmlFile, project), 'text/x-shellscript'))) return false;
  await sleep(350);
  status?.('Guardando acceso directo (.desktop)…');
  const okDesk = await saveTextFile(desktopFile, linuxDesktopFor(shFile, project), 'text/plain');
  showToast(
    okDesk
      ? `Paquete Linux listo 🐧: ejecuta «chmod +x ${shFile}» y ábrelo (el .AppImage/.deb sale del workflow «Bundle escritorio»)`
      : 'Se descargó el .html y el .sh; el .desktop no se pudo guardar'
  );
  return okDesk;
}

/** Modal «Compilar novela»: valida, estima tamaño y descarga el formato elegido. */
export function openCompileModal(initial: CompileFormat = 'html') {
  playSynthSfx('click');
  let format: CompileFormat = initial;
  const modal = document.getElementById('drawerModal');
  const titleEl = document.getElementById('drawerModalTitle');
  const bodyEl = document.getElementById('drawerModalBody');
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = 'Compilar novela';

  const render = () => {
    const issues = validateStory();
    const errors = issues.filter((i) => i.level === 'error');
    const warnings = issues.filter((i) => i.level === 'aviso');
    const stem = sanitizeFileStem(ctx.state.projectName);
    let htmlBytes = 0;
    try {
      htmlBytes = new Blob([buildStandaloneHtml()]).size;
    } catch {}
    let jsonBytes = 0;
    try {
      jsonBytes = new Blob([JSON.stringify(buildHistoria())]).size;
    } catch {}
    const fmtMeta: Record<CompileFormat, { label: string; file: string; size: string; desc: string }> = {
      html: {
        label: '🌐 Web (.html)',
        file: `${stem}_Web.html`,
        size: formatBytes(htmlBytes),
        desc: 'Un solo archivo jugable: doble clic y se juega en cualquier navegador, sin servidor ni instalación.'
      },
      vnjson: {
        label: '📦 Historia (.vn.json)',
        file: `${stem}.vn.json`,
        size: formatBytes(jsonBytes),
        desc: 'Formato portable con grafo + assets. Sirve para importar, respaldar o alimentar el workflow que compila el .exe/.AppImage.'
      },
      windows: {
        label: '🪟 Windows (lanzador + guía .exe)',
        file: `${stem}_Web.html + Iniciar_${stem}.bat`,
        size: formatBytes(htmlBytes),
        desc: 'Descarga inmediata y funcional: el .html jugable + lanzador .bat (doble clic para jugar). El .exe nativo (instalador) se genera con Actions → «Bundle escritorio (.exe + Linux)» (runner Windows, NSIS).'
      },
      linux: {
        label: '🐧 Linux (lanzadores + guía)',
        file: `${stem}_Web.html + .sh + .desktop`,
        size: formatBytes(htmlBytes),
        desc: 'Descarga inmediata y funcional: .html + jugar-*.sh (chmod +x) + .desktop. El .AppImage/.deb nativo se genera con Actions → «Bundle escritorio (.exe + Linux)».'
      }
    };
    const m = fmtMeta[format];
    const optBtn = (f: CompileFormat) =>
      `<button data-compile-fmt="${f}" class="px-3 py-2.5 rounded-xl text-xs font-bold border transition min-h-[44px] ${format === f ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-800 text-slate-200 border-slate-600'}">${fmtMeta[f].label}</button>`;

    bodyEl.innerHTML = `
      <div class="space-y-4">
        <div class="p-3.5 rounded-xl bg-[#101528] border border-cyan-500/30 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="font-bold text-cyan-300 text-sm truncate">«${escapeHtml(ctx.state.projectName || 'Mi Novela')}»</div>
            <div class="text-xs text-slate-400">${ctx.state.nodes.length} nodos · ${ctx.state.wires.length} enlaces · inicio: ${escapeHtml(getStartNodeId(ctx.state) || '—')}</div>
          </div>
          <span class="px-2.5 py-1 rounded text-xs font-mono shrink-0 ${errors.length ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}">${errors.length ? 'Bloqueado' : 'Listo'}</span>
        </div>
        ${errors.length ? `<div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs text-rose-200 space-y-1">${errors.map((e) => `<div>⛔ ${escapeHtml(e.msg)}</div>`).join('')}</div>` : ''}
        ${warnings.length ? `<div class="p-3 rounded-xl bg-amber-400/10 border border-amber-400/40 text-xs text-amber-200 space-y-1 max-h-32 overflow-y-auto">${warnings.map((w) => `<div>⚠️ ${escapeHtml(w.msg)}</div>`).join('')}</div>` : ''}
        ${!errors.length && !warnings.length ? `<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-200">✅ Sin problemas: la historia compila limpia.</div>` : ''}
        <div>
          <div class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Formato de salida</div>
          <div class="grid grid-cols-2 gap-2">${optBtn('html')}${optBtn('vnjson')}${optBtn('windows')}${optBtn('linux')}</div>
        </div>
        <div class="p-3.5 rounded-xl bg-[#101528] border border-slate-700">
          <div class="font-bold text-white text-sm">${m.label}</div>
          <div class="text-xs text-slate-400 mt-1">${m.desc}</div>
          <div class="text-[11px] text-slate-500 mt-2 font-mono break-all">📄 ${escapeHtml(m.file)} · ~${m.size}</div>
          ${htmlBytes > 8 * 1024 * 1024 ? `<div class="text-[11px] text-amber-300 mt-1">⚠️ Pesa más de 8 MB (normal con vídeos): el .html puede tardar en abrirse; considera quitar vídeos pesados.</div>` : ''}
          <div id="compileStatus" class="text-xs text-cyan-300 mt-2 min-h-[18px]"></div>
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <button id="btnCompileClose" class="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 min-h-[44px]">Cerrar</button>
          <button id="btnCompileGo" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-xs font-bold text-slate-950 min-h-[44px]">⬇ Descargar ${m.label}</button>
        </div>
      </div>`;
    modal.classList.remove('hidden');
    bodyEl.querySelectorAll('[data-compile-fmt]').forEach((b) => {
      (b as HTMLElement).onclick = () => {
        format = (b as HTMLElement).dataset.compileFmt as CompileFormat;
        playSynthSfx('click');
        render();
      };
    });
    (document.getElementById('btnCompileClose') as HTMLElement).onclick = () => modal.classList.add('hidden');
    (document.getElementById('btnCompileGo') as HTMLElement).onclick = async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const statusEl = document.getElementById('compileStatus');
      const setStatus = (s: string) => {
        if (statusEl) statusEl.textContent = s;
      };
      btn.disabled = true;
      btn.textContent = 'Compilando… ⏳';
      try {
        if (format === 'html') {
          setStatus('Generando .html…');
          await exportStandaloneHtmlFile();
        } else if (format === 'vnjson') {
          setStatus('Generando .vn.json…');
          await exportHistoriaJson();
        } else if (format === 'windows') {
          await exportWindowsPackage(setStatus);
        } else {
          await exportLinuxPackage(setStatus);
        }
        setStatus('¡Listo! Revisa tu carpeta de descargas. ✅');
      } finally {
        btn.disabled = false;
        render();
      }
    };
  };
  render();
}
