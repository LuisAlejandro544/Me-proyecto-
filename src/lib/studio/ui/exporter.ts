// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { playSynthSfx } from '../domain/audio';
import { escapeHtml } from '../domain/geometry';
import { showToast } from './toast';
import { getCharacterCatalog } from '../../assets';

export function exportStandaloneHtml() {
  playSynthSfx('connect');
  const catalog = getCharacterCatalog();
  const serialized = JSON.stringify({
    nodes: ctx.state.nodes,
    wires: ctx.state.wires,
    assets: catalog
  });

  const standaloneHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${escapeHtml(ctx.state.projectName)} — Novela visual</title>
<style>
  body { margin:0; font-family: system-ui, sans-serif; background:#0b0f1f; color:#fff; display:flex; align-items:center; justify-content:center; height:100vh; overflow:hidden; }
  .stage { width:min(920px, 96vw); height:min(540px, 90vh); background:radial-gradient(circle at 50% 30%, #263566, #0b0f1f); border:2px solid #00f2fe; border-radius:20px; display:flex; flex-direction:column; justify-content:space-between; padding:24px; box-sizing:border-box; box-shadow:0 0 40px rgba(0,242,254,0.25); position:relative; }
  .sprite { max-height:240px; border-radius:16px; border:2px solid rgba(255,255,255,0.25); align-self:center; margin-top:20px; }
  .box { background:rgba(15,20,40,0.92); border:1px solid rgba(0,242,254,0.45); border-radius:16px; padding:20px; }
  .speaker { font-weight:700; color:#ff758c; margin-bottom:6px; }
  .choices { display:flex; flex-direction:column; gap:10px; margin-top:12px; }
  button { background:#1e294b; color:#fff; border:1px solid #00f2fe; padding:10px 16px; border-radius:10px; cursor:pointer; font-weight:600; }
  button:hover { background:#00f2fe; color:#0b0f1f; }
</style>
</head>
<body>
<div class="stage">
  <img id="sp" class="sprite" />
  <div class="box">
<div id="spk" class="speaker"></div>
<div id="dlg"></div>
<div id="ch" class="choices"></div>
  </div>
</div>
<script>
const DATA = ${serialized};
function go(id) {
  const n = DATA.nodes.find(x => x.id === id) || DATA.nodes[0];
  if (!n) return;
  const c = DATA.assets[n.characterId || n.selectedCharId || 'sora'] || DATA.assets.sora;
  document.getElementById('sp').src = c.avatar;
  document.getElementById('spk').textContent = n.speaker || c.name;
  document.getElementById('dlg').textContent = n.dialogue || n.title || '';
  const ch = document.getElementById('ch');
  ch.innerHTML = '';
  const outs = DATA.wires.filter(w => w.fromNode === n.id);
  if (n.type === 'choice' && n.options) {
n.options.forEach(o => {
  const w = outs.find(x => x.fromPort === 'out_' + o.id);
  const b = document.createElement('button');
  b.textContent = o.label;
  b.onclick = () => w ? go(w.toNode) : (document.getElementById('dlg').textContent = '[Fin de esta rama]');
  ch.appendChild(b);
});
  } else if (outs.length) {
const b = document.createElement('button');
b.textContent = 'Continuar →';
b.onclick = () => go(outs[0].toNode);
ch.appendChild(b);
  }
}
go(DATA.nodes[0]?.id);
<\/script>
</body>
</html>`;

  const blob = new Blob([standaloneHtml], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Mi_Novela_Web.html';
  a.click();
  showToast('¡Novela web autónoma (.html) exportada!');
}
export function openExeExportModal() {
  playSynthSfx('click');
  const modal = document.getElementById('drawerModal');
  document.getElementById('drawerModalTitle').textContent = 'Empaquetador Windows (.exe)';
  document.getElementById('drawerModalBody').innerHTML = `
    <div class="space-y-4">
      <div class="p-3.5 rounded-xl bg-[#101528] border border-cyan-500/30 flex items-center justify-between">
        <div>
          <div class="font-bold text-cyan-300 text-sm">Mi_Novela_Win64_Runtime.exe</div>
          <div class="text-xs text-slate-400">Incluye ${ctx.state.nodes.length} nodos, ${ctx.state.wires.length} enlaces neón y sprites de personajes</div>
        </div>
        <span class="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 text-xs font-mono">Listo</span>
      </div>
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="p-3 rounded-xl bg-[#101528] border border-slate-700">
          <div class="text-slate-400">Resolución</div>
          <div class="font-semibold text-white mt-0.5">1920 × 1080 (Full HD)</div>
        </div>
        <div class="p-3 rounded-xl bg-[#101528] border border-slate-700">
          <div class="text-slate-400">Motor</div>
          <div class="font-semibold text-white mt-0.5">Contenedor DirectX / WebView2</div>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button id="btnCloseExeModal" class="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cerrar</button>
        <button id="btnConfirmExeDownload" class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-xs font-bold text-slate-950">
          Descargar manifiesto de Windows (.bat)
        </button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  document.getElementById('btnCloseExeModal').onclick = () => modal.classList.add('hidden');
  document.getElementById('btnConfirmExeDownload').onclick = () => {
    const batContent = `@echo off\r\necho Iniciando Mi Novela Visual Novel Runtime...\r\nstart "" "Mi_Novela_Web.html"\r\n`;
    const blob = new Blob([batContent], { type: 'application/bat' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Iniciar_Mi_Novela.bat';
    a.click();
    modal.classList.add('hidden');
    showToast('¡Lanzador de Windows descargado!');
  };
}
