// @ts-nocheck
// Workspace: carpeta de recursos (helpers) (extraído de ui/workspace.ts — barrel en ui/workspace.ts).
import { CHARACTER_ASSETS } from '../../data/assets';
import { showToast } from '../toast';
import { escapeHtml } from '../../domain/geometry';
import {
  getCustomAssets, normalizeTags, pickAudioFiles, pickFilesAsAssets,
  pickGalleryImages, pickGalleryVideos, removeCustomAsset, renameCustomAsset,
  setAssetTags, takePhotoAsAsset,
} from '../../../assets';
export function handleImportResult(res: { agregados: number; rechazados: string[] }, okMsg: string, reopen: () => void) {
  if (res.agregados > 0) {
    showToast(`${okMsg}: ${res.agregados} recurso(s) 🎉`);
    reopen();
  } else if (res.rechazados.length) {
    showToast(res.rechazados[0]);
  } else {
    showToast('No se eligió ningún archivo');
  }
}


export function allCharacterAssets() {
  const customs = {};
  for (const a of getCustomAssets()) {
    if (a.kind !== 'imagen') continue;
    customs[a.id] = {
      id: a.id,
      name: a.name,
      color: '#22d3ee',
      avatar: a.dataUrl,
      banner: a.dataUrl,
      expressions: ['Personalizado'],
      custom: true
    };
  }
  return { ...CHARACTER_ASSETS, ...customs };
}


export function assetPreviewHtml(a: { kind: string; dataUrl: string; name: string }): string {
  if (a.kind === 'imagen') {
    return `<img src="${a.dataUrl}" loading="lazy" class="w-full h-24 rounded-lg object-cover border border-white/15" alt="${escapeHtml(a.name)}" />`;
  }
  if (a.kind === 'video') {
    return `<video src="${a.dataUrl}" muted playsinline preload="metadata" class="w-full h-24 rounded-lg object-cover border border-fuchsia-400/30 bg-black"></video>`;
  }
  return `<div class="w-full h-24 rounded-lg bg-gradient-to-br from-violet-600/40 to-cyan-500/30 border border-white/15 flex flex-col items-center justify-center gap-1 text-2xl">🎵<span class="text-[10px] text-slate-300 font-semibold">Audio</span></div>`;
}


export function wireFolderActions(reopen: () => void, scope: 'assets' | 'characters') {
  const bodyEl = document.getElementById('drawerModalBody');
  if (!bodyEl) return;

  const btnFiles = bodyEl.querySelector('#btnAddMoreFiles');
  if (btnFiles) {
    (btnFiles as HTMLElement).onclick = async () => {
      showToast(scope === 'assets' ? 'Abriendo archivos…' : 'Abriendo archivos de imagen…');
      const res = await pickFilesAsAssets(scope === 'assets' ? undefined : 'image/*,.png,.jpg,.jpeg,.webp,.gif');
      handleImportResult(res, 'Añadido a la carpeta', reopen);
    };
  }
  const btnGallery = bodyEl.querySelector('#btnAddMoreGallery');
  if (btnGallery) {
    (btnGallery as HTMLElement).onclick = async () => {
      showToast('Abriendo galería…');
      const res = await pickGalleryImages(10);
      if (res.agregados > 0) {
        handleImportResult(res, 'Añadido a la carpeta', reopen);
      } else {
        // En móvil el usuario puede preferir Archivos tras cancelar galería.
        showToast('Galería sin selección — prueba con «Archivos»');
      }
    };
  }
  const btnCamera = bodyEl.querySelector('#btnAddMoreCamera');
  if (btnCamera) {
    (btnCamera as HTMLElement).onclick = async () => {
      const res = await takePhotoAsAsset();
      if (res.agregados > 0) {
        showToast('Foto guardada en la carpeta 📷');
        reopen();
      } else {
        showToast('No se tomó ninguna foto');
      }
    };
  }
  const btnVideo = bodyEl.querySelector('#btnAddMoreVideo');
  if (btnVideo) {
    (btnVideo as HTMLElement).onclick = async () => {
      showToast('Abriendo vídeos…');
      const res = await pickGalleryVideos();
      handleImportResult(res, 'Vídeo(s) añadido(s)', reopen);
    };
  }
  const btnAudio = bodyEl.querySelector('#btnAddMoreAudio');
  if (btnAudio) {
    (btnAudio as HTMLElement).onclick = async () => {
      showToast('Abriendo audios…');
      const res = await pickAudioFiles();
      handleImportResult(res, 'Audio(s) añadido(s)', reopen);
    };
  }

  // Renombrar (delegado): ✏️ → input inline → guardar/cancelar.
  bodyEl.querySelectorAll('[data-rename-asset]').forEach((btn) => {
    (btn as HTMLElement).onclick = (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.renameAsset;
      const card = bodyEl.querySelector(`[data-asset-card="${id}"]`);
      const label = card?.querySelector('[data-asset-name]');
      if (!card || !label) return;
      const current = getCustomAssets().find((a) => a.id === id)?.name ?? '';
      label.innerHTML = `
        <span class="flex items-center gap-1.5" data-rename-box>
          <input data-rename-input value="${escapeHtml(current)}" maxlength="60"
            class="flex-1 min-w-0 px-2 py-1 rounded-lg bg-slate-900 border border-cyan-400/60 text-xs text-white outline-none" />
          <button data-rename-save class="px-2 py-1 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold">✓</button>
          <button data-rename-cancel class="px-2 py-1 rounded-lg bg-slate-700 text-slate-200 text-xs font-bold">✕</button>
        </span>`;
      const input = label.querySelector('[data-rename-input]') as HTMLInputElement | null;
      input?.focus();
      input?.select();
      const save = () => {
        const ok = renameCustomAsset(id, input?.value ?? '');
        showToast(ok ? `Renombrado a «${(input?.value ?? '').trim()}» ✏️` : 'El nombre no puede quedar vacío');
        if (ok) reopen();
      };
      label.querySelector('[data-rename-save]')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        save();
      });
      label.querySelector('[data-rename-cancel]')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        reopen();
      });
      input?.addEventListener('keydown', (ev) => {
        ev.stopPropagation();
        if (ev.key === 'Enter') save();
        if (ev.key === 'Escape') reopen();
      });
      input?.addEventListener('click', (ev) => ev.stopPropagation());
    };
  });

  // Etiquetas (delegado): ✏️ → input inline → guardar.
  bodyEl.querySelectorAll('[data-edit-tags]').forEach((btn) => {
    (btn as HTMLElement).onclick = (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.editTags;
      const box = bodyEl.querySelector(`[data-tags-box="${id}"]`);
      if (!box) return;
      const current = getCustomAssets().find((a) => a.id === id)?.tags ?? [];
      box.innerHTML = `
        <span class="flex items-center gap-1.5 w-full" data-tags-edit>
          <input data-tags-input value="${escapeHtml(current.join(', '))}" maxlength="120" placeholder="fondo, noche…"
            class="flex-1 min-w-0 px-2 py-1 rounded-lg bg-slate-900 border border-fuchsia-400/60 text-[11px] text-white outline-none" />
          <button data-tags-save class="px-2 py-1 rounded-lg bg-fuchsia-500 text-white text-xs font-bold">✓</button>
        </span>`;
      const input = box.querySelector('[data-tags-input]') as HTMLInputElement | null;
      input?.focus();
      const save = () => {
        const tags = normalizeTags((input?.value ?? '').split(','));
        setAssetTags(id, tags);
        showToast(tags.length ? `Etiquetas: ${tags.map((t) => `#${t}`).join(' ')} 🏷` : 'Etiquetas borradas 🏷');
        reopen();
      };
      box.querySelector('[data-tags-save]')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        save();
      });
      input?.addEventListener('keydown', (ev) => {
        ev.stopPropagation();
        if (ev.key === 'Enter') save();
        if (ev.key === 'Escape') reopen();
      });
      input?.addEventListener('click', (ev) => ev.stopPropagation());
    };
  });

  bodyEl.querySelectorAll('[data-remove-custom]').forEach((btn) => {
    (btn as HTMLElement).onclick = (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.removeCustom;
      const name = getCustomAssets().find((a) => a.id === id)?.name ?? 'recurso';
      if (!confirm(`¿Eliminar «${name}» de la carpeta?`)) return;
      removeCustomAsset(id);
      showToast('Recurso eliminado 🗑');
      reopen();
    };
  });
}

