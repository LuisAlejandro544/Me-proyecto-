// @ts-nocheck
// Compilador: modal Compilar novela (extraído de ui/compile.ts — ver barrel ui/compile.ts).
import { ctx } from '../../context';
import { playSynthSfx } from '../../domain/audio';
import { escapeHtml } from '../../domain/geometry';
import { showToast } from '../toast';
import { getStartNodeId } from '../../storage';
import type { CompileFormat } from './types';
import { sanitizeFileStem } from './types';
import { validateStory } from './validate';
import { buildHistoria } from './historia';
import { buildStandaloneHtml, formatBytes } from './standalone';
import { exportHistoriaJson, exportLinuxPackage, exportStandaloneHtmlFile, exportWindowsPackage } from './files';
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
            <div class="text-xs text-slate-400">${ctx.state.nodes.length} nodos · ${ctx.state.wires.length} enlaces · ${(ctx.state.scenes ?? []).length} escena(s) · inicio: ${escapeHtml(getStartNodeId(ctx.state) || '—')}</div>
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
