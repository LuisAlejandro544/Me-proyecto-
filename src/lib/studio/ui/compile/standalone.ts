// @ts-nocheck
// Compilador: generador standalone .html (extraído de ui/compile.ts — ver barrel ui/compile.ts).
import { ctx } from '../../context';
import { escapeHtml } from '../../domain/geometry';
import { getStartNodeId } from '../../storage';
import { getCharacterCatalog, getCustomAssets } from '../../../assets';
import { CHARACTER_ASSETS } from '../../data/assets';
import { DIALOGUE_FONTS, dialogueAnimationCss, getAllDialogueThemes, getProjectDialogueThemeId } from '../../../dialogue-themes';
import { assetAnimationsCss, getProjectAssetDefaults } from '../../../asset-animations';
import { collectUsedPayload } from './historia';
/**
 * Generador standalone ÚNICO: novela jugable autocontenida (file://, sin servidor).
 * Incluye startNodeId, variables, audio/vídeo, decisiones y reinicio.
 */
export function buildStandaloneHtml(): string {
  const startId = getStartNodeId(ctx.state);
  const project = ctx.state.projectName || 'Mi Novela';
  const { nodes, wires, assets, customs, dialogueThemes, dialogueThemeId, scenes, animDefaults } = collectUsedPayload();
  const fontStacks: Record<string, string> = {};
  for (const f of DIALOGUE_FONTS) fontStacks[f.id] = f.stack;
  const serialized = JSON.stringify({
    proyecto: project,
    startNodeId: startId,
    scenes,
    variables: ctx.state.variables ?? {},
    nodes,
    wires,
    assets,
    customs,
    dialogueThemes,
    dialogueThemeId,
    fontStacks,
    animDefaults
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
${assetAnimationsCss()}
  #spWrap { display:flex; justify-content:center; }
  #spWrap.vn-asset-motion-float, #spWrap.vn-asset-motion-sway, #spWrap.vn-asset-motion-bob,
  #spWrap.vn-asset-motion-pulse, #spWrap.vn-asset-motion-breathe,
  #spWrap.vn-asset-motion-shake-soft, #spWrap.vn-asset-motion-spin-slow { will-change: transform; }
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
  <div class="media" id="spWrap"><img id="sp" class="sprite" alt="Personaje" /></div>
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
function sceneOf(nodeId){
  var nodes = DATA.nodes || [];
  var cur = null;
  for (var i=0;i<nodes.length;i++){ if (nodes[i].id===nodeId){ cur = nodes[i]; break; } }
  var scenes = DATA.scenes || [];
  if (cur && cur.sceneId) {
    for (var j=0;j<scenes.length;j++){ if (scenes[j].id===cur.sceneId) return scenes[j]; }
  }
  for (var k=0;k<scenes.length;k++){
    if (scenes[k].startNodeId===nodeId || scenes[k].endNodeId===nodeId) return scenes[k];
  }
  return null;
}
function sceneById(id){
  var scenes = DATA.scenes || [];
  for (var i=0;i<scenes.length;i++){ if (scenes[i].id===id) return scenes[i]; }
  return null;
}
function nodeExists(id){
  var nodes = DATA.nodes || [];
  for (var i=0;i<nodes.length;i++){ if (nodes[i].id===id) return true; }
  return false;
}
function sceneStart(id){
  var s = sceneById(id);
  if (!s) return null;
  if (s.startNodeId && nodeExists(s.startNodeId)) return s.startNodeId;
  var nodes = DATA.nodes || [];
  for (var i=0;i<nodes.length;i++){ if (nodes[i].sceneId===id) return nodes[i].id; }
  return null;
}
function continueTarget(nodeId){
  var nodes = DATA.nodes || [];
  var cur = null;
  for (var i=0;i<nodes.length;i++){ if (nodes[i].id===nodeId){ cur = nodes[i]; break; } }
  if (!cur) return null;
  if (cur.nextSceneId) { var t = sceneStart(cur.nextSceneId); if (t) return t; }
  var owner = (cur.sceneId && sceneById(cur.sceneId)) || sceneOf(nodeId);
  if (owner && owner.endNodeId===nodeId) {
    var scenes = DATA.scenes || [];
    for (var j=0;j<scenes.length;j++){
      if (scenes[j].id===owner.id && j+1<scenes.length) {
        var nx = sceneStart(scenes[j+1].id);
        if (nx) return nx;
      }
    }
  }
  return null;
}
  var __prevScene = null;
  var __bgUrl = null;
  var __waitTimer = null;
  function fxKindLabel(k) {
    return { flash: "⚡ Flash", "fade-black": "⬛ Fundido", shake: "📳 Sacudida", "zoom-punch": "👊 Zoom", hearts: "💖 Corazones", rain: "🌧 Lluvia", snow: "❄ Nieve", sparkles: "✨ Chispas" }[k] || "✨ Efecto";
  }
  function endingKindLabel(k) {
    return { bueno: "🌅 Final bueno", malo: "🌑 Final malo", secreto: "🗝 Final secreto", neutral: "🌫 Final neutral" }[k] || "🏁 Final";
  }
  function playFx(kind, ms) {
    try {
      var stage = document.querySelector(".stage");
      if (!stage) return;
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
      var dur = Math.max(200, Math.min(3000, Number(ms) || 600));
      if (kind === "flash" || kind === "fade-black") {
        var o = document.createElement("div");
        o.style.cssText = "position:fixed;inset:0;z-index:99;pointer-events:none;background:" + (kind === "flash" ? "#fff" : "#000") + ";opacity:0;transition:opacity 180ms;";
        document.body.appendChild(o);
        requestAnimationFrame(function(){ o.style.opacity = "0.9"; });
        setTimeout(function(){ o.style.opacity = "0"; }, Math.max(120, dur - 220));
        setTimeout(function(){ try { o.remove(); } catch(e){} }, dur);
      } else if (kind === "shake" || kind === "zoom-punch") {
        try {
          stage.animate(
            kind === "shake"
              ? [{ transform: "translateX(0)" }, { transform: "translateX(-10px)" }, { transform: "translateX(10px)" }, { transform: "translateX(-5px)" }, { transform: "translateX(0)" }]
              : [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }],
            { duration: Math.min(dur, 800), iterations: kind === "shake" ? 2 : 1 });
        } catch(e){}
      } else {
        var emoji = kind === "hearts" ? "💖" : kind === "rain" ? "🌧" : kind === "snow" ? "❄" : "✨";
        var layer = document.createElement("div");
        layer.style.cssText = "position:fixed;inset:0;z-index:99;pointer-events:none;display:flex;justify-content:space-around;font-size:30px;";
        for (var i = 0; i < 12; i++) { var s = document.createElement("span"); s.textContent = emoji; layer.appendChild(s); }
        document.body.appendChild(layer);
        try { layer.animate([{ transform: "translateY(-30px)", opacity: 0 }, { transform: "translateY(40vh)", opacity: 1 }], { duration: dur, easing: "ease-in" }); } catch(e){}
        setTimeout(function(){ try { layer.remove(); } catch(e){} }, dur + 60);
      }
    } catch(e){}
  }
function resolveAnim(n, sc) {
  var d = DATA.animDefaults || {};
  var enter = n.assetEnter || d.enter || "fade-in";
  var motion = n.assetMotion || d.motion || "none";
  var trans = n.sceneTransition || (sc && sc.enterTransition) || d.transition || "fade";
  var dur = Math.max(120, Math.min(2000, Number(d.durationMs) || 450));
  return { enter: enter, motion: motion, transition: trans, dur: dur };
}
function restartAnim(el, cls) {
  if (!el) return;
  var rm = [];
  for (var i = 0; i < el.classList.length; i++) {
    var c = el.classList[i];
    if (c.indexOf("vn-asset-enter-") === 0 || c.indexOf("vn-stage-trans-") === 0 || c === "vn-asset-enter" || c === "vn-stage-trans") rm.push(c);
  }
  for (var j = 0; j < rm.length; j++) el.classList.remove(rm[j]);
  void el.offsetWidth;
  var parts = cls.split(" ");
  for (var k = 0; k < parts.length; k++) if (parts[k]) el.classList.add(parts[k]);
}
function go(id) {
  var n = null;
  for (var i=0;i<DATA.nodes.length;i++){ if (DATA.nodes[i].id===id){ n=DATA.nodes[i]; break; } }
  if (!n) n = DATA.nodes[0];
  if (!n) return;
  if (__waitTimer) { try { clearTimeout(__waitTimer); } catch(e){} __waitTimer = null; }
  visited++; var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var catalog = DATA.assets || {};
  var c = catalog[n.characterId || n.selectedCharId || ""] || null;
  var sp = document.getElementById("sp");
  var vp = document.getElementById("vp");
  var ap = document.getElementById("ap");
  try { vp.pause(); } catch(e){}
  vp.style.display = "none"; vp.removeAttribute("src"); sp.style.display = "";
  try { ap.pause(); } catch(e){}
  function customOf(id){ return (DATA.customs || {})[id]; }
  var sc = sceneOf(n.id);
  var anim = resolveAnim(n, sc);
  var sceneChanged = __prevScene !== null && __prevScene !== ((sc && sc.id) || null);
  var firstStep = __prevScene === null;
  __prevScene = ((sc && sc.id) || null);
  document.documentElement.style.setProperty("--vn-anim-dur", anim.dur + "ms");
  var label = n.badge || n.headerBar || n.title || n.topTitle || DATA.proyecto || "Novela";
  document.getElementById("t").textContent = DATA.proyecto || "Novela";
  document.getElementById("m").textContent = (sc ? ("🎬 " + sc.name + " · ") : "") + label + " · paso " + visited;
  // Movimiento continuo en el contenedor + aparición del medio + transición de escenario.
  var wrap = document.getElementById("spWrap");
  if (wrap) {
    var rm2 = [];
    for (var mi = 0; mi < wrap.classList.length; mi++) {
      if (wrap.classList[mi].indexOf("vn-asset-motion-") === 0) rm2.push(wrap.classList[mi]);
    }
    for (var mj = 0; mj < rm2.length; mj++) wrap.classList.remove(rm2[mj]);
    if (!reduceMotion && anim.motion !== "none") wrap.classList.add("vn-asset-motion-" + anim.motion);
  }
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
    if (c && c.avatar) { sp.src = c.avatar; sp.style.display = ""; }
    else { sp.style.display = "none"; try { sp.removeAttribute("src"); } catch(e){} }
    var spkName = (n.type === "sound_cue") ? (n.soundName || n.audioName || "🔊 Sonido")
      : (n.type === "narration") ? "📖 Narración"
      : (n.type === "monologue") ? ("💭 " + (n.speaker || (c && c.name) || "Pensamiento"))
      : (n.type === "ending") ? endingKindLabel(n.endingKind)
      : (n.type === "jump") ? "↗️ Salto"
      : (n.type === "wait") ? "⏳ Pausa"
      : (n.type === "effect") ? fxKindLabel(n.effectKind)
      : (n.type === "background") ? "🖼️ Fondo"
      : (n.speaker || (c && c.name) || "Narrador");
    document.getElementById("spk").textContent = spkName;
    document.getElementById("spk").style.color = (n.type === "sound_cue") ? "#fbbf24"
      : (n.type === "narration") ? "#cbd5e1"
      : (n.type === "monologue") ? (n.speakerColor || "#a78bfa")
      : (n.type === "ending") ? "#6ee7b7"
      : (n.type === "jump") ? "#7dd3fc"
      : (n.type === "wait") ? "#fde68a"
      : (n.type === "effect") ? "#f9a8d4"
      : (n.speakerColor || (c && c.color) || "#94a3b8");
  }
  // Nodo background: el fondo persiste en los pasos siguientes.
  // Narración con fondo opcional: solo se muestra en este paso.
  if ((n.type === "background" || n.type === "narration") && n.backgroundAssetId) {
    var bgc = customOf(n.backgroundAssetId);
    if (bgc && bgc.dataUrl) {
      if (n.type === "background") __bgUrl = bgc.dataUrl;
      var stageBg = document.querySelector(".stage");
      if (stageBg) { stageBg.style.backgroundImage = 'url("' + bgc.dataUrl + '")'; stageBg.style.backgroundSize = "cover"; stageBg.style.backgroundPosition = "center"; }
    }
  }
  // Nodo effect: destello / sacudida / partículas sobre el escenario.
  if (n.type === "effect") { playFx(n.effectKind || "shake", Number(n.effectDurationMs ?? 600)); }
  if (!reduceMotion) {
    var mediaEl = (n.type === "video_scene") ? vp : sp;
    if (mediaEl && mediaEl.style.display !== "none" && anim.enter !== "none") {
      restartAnim(mediaEl, "vn-asset-enter vn-asset-enter-" + anim.enter);
    }
    var stageEl = document.querySelector(".stage");
    var forcesTrans = !!(n.sceneTransition && n.sceneTransition !== "none");
    if (stageEl && anim.transition !== "none" && (sceneChanged || forcesTrans || firstStep)) {
      restartAnim(stageEl, "vn-stage-trans vn-stage-trans-" + anim.transition);
    }
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
    var full = (n.type === "choice") ? "Elige tu próxima decisión:"
      : (n.type === "ending") ? (((n.endingTitle || n.title) ? ((n.endingTitle || n.title) + "\\n") : "") + (n.dialogue || ""))
      : (n.type === "wait") ? ((n.dialogue || "…") + "\\n⏳ " + Number(n.waitMs ?? 800) + " ms…")
      : (n.dialogue || n.title || "…");
    dlg.style.fontFamily = stack;
    dlg.style.fontSize = (t.fontSize || 16) + "px";
    dlg.style.color = t.fontColor || "#fff";
    dlg.style.fontStyle = (n.type === "monologue") ? "italic" : "normal";
    dlg.style.textAlign = (n.type === "narration" || n.type === "ending") ? "center" : "left";
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
      var target = w ? w.toNode : null;
      var jumpName = "";
      if (!target && o.gotoSceneId) { target = sceneStart(o.gotoSceneId); var js = sceneById(o.gotoSceneId); if (js) jumpName = js.name; }
      if (!target && n.nextSceneId) { target = sceneStart(n.nextSceneId); }
      var b = document.createElement("button");
      b.className = "btn"; b.textContent = jumpName ? (o.label + "  → 🎬 " + jumpName) : o.label;
      b.onclick = function(){
        if (target) go(target);
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
  } else if (n.type === "ending") {
    end.style.display = "";
    end.textContent = "🏁 " + (n.endingTitle || n.title || endingKindLabel(n.endingKind)) + " — ¡gracias por jugar! Pulsa ↻ Reiniciar para volver al inicio.";
    document.onkeydown = null;
  } else {
    var jt = null;
    if (n.type === "jump") {
      if (n.jumpNodeId && nodeExists(n.jumpNodeId)) jt = n.jumpNodeId;
      else if (n.jumpSceneId) jt = sceneStart(n.jumpSceneId);
    }
    if (n.type === "wait" && (jt || continueTarget(n.id))) {
      var wt = jt || continueTarget(n.id);
      var wms = Math.max(200, Math.min(5000, Number(n.waitMs ?? 800)));
      var bw = document.createElement("button");
      bw.className = "btn"; bw.textContent = "Omitir espera (" + wms + " ms) →";
      bw.onclick = function(){ if (__waitTimer) { clearTimeout(__waitTimer); __waitTimer = null; } go(wt); };
      ch.appendChild(bw);
      __waitTimer = setTimeout(function(){ __waitTimer = null; go(wt); }, wms);
      document.onkeydown = function(e){
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (__waitTimer) { clearTimeout(__waitTimer); __waitTimer = null; } go(wt); }
      };
    } else {
    var ct = jt || continueTarget(n.id);
    var cs = ct ? sceneOf(ct) : null;
    if (ct) {
      var b2 = document.createElement("button");
      b2.className = "btn"; b2.textContent = n.type === "jump" ? ("Saltar" + (cs ? " → 🎬 " + cs.name : " →")) : (cs ? ("Continuar → 🎬 " + cs.name) : "Continuar →");
      b2.onclick = function(){ go(ct); };
      ch.appendChild(b2);
      document.onkeydown = function(e){
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(ct); }
      };
    } else {
      end.style.display = "";
      end.textContent = "✦ Fin de esta rama — ¡gracias por jugar! Pulsa ↻ Reiniciar para volver al inicio.";
      document.onkeydown = null;
    }
    }
  }
}
document.getElementById("restart").onclick = function(){ visited = 0; __prevScene = null; go(START); };
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
