// @ts-nocheck
// Workspace — router fino (pestañas partidas en ui/workspace/*.ts).
// Re-exporta el contrato público; cada pestaña vive en su módulo.
import { ctx } from '../context';
import { playSynthSfx } from '../domain/audio';
import { startPlaytest } from './playtest';
import { openDialogueStudio } from './dialogue';
import { openScenesStudio } from './scenes';
import { animateTabSwitch } from './workspace/tab-switch';
import { renderNodesTab } from './workspace/tab-nodes';
import { renderAssetsTab } from './workspace/tab-assets';
import { renderTimelineTab } from './workspace/tab-timeline';
import { renderCharactersTab } from './workspace/tab-characters';
import { renderSettingsTab } from './workspace/tab-settings';

export { wsUi } from './workspace/state';
export { animateTabSwitch } from './workspace/tab-switch';
export { allCharacterAssets, assetPreviewHtml, wireFolderActions } from './workspace/folder';
export { addNewNodeOfType } from './workspace/tab-nodes-factory';
export { renderNodesTab } from './workspace/tab-nodes';
export { renderAssetsTab } from './workspace/tab-assets';
export { renderTimelineTab } from './workspace/tab-timeline';
export { renderCharactersTab } from './workspace/tab-characters';
export { renderSettingsTab } from './workspace/tab-settings';

export function openWorkspaceTab(tabName) {
  playSynthSfx('click');
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    const isCurrent = btn.dataset.tab === tabName;
    btn.classList.toggle('text-cyan-300', isCurrent);
    btn.classList.toggle('text-slate-400', !isCurrent);
  });
  if (tabName === 'playtest') {
    startPlaytest();
    animateTabSwitch(tabName);
    return;
  }
  if (tabName === 'compositor' || tabName === 'composer') {
    try { document.getElementById('drawerModal')?.classList.add('hidden'); } catch {}
    animateTabSwitch('compositor');
    window.dispatchEvent(new CustomEvent('vn:open-composer'));
    return;
  }
  if (tabName === 'dialogues' || tabName === 'dialogos' || tabName === 'dialogo') {
    animateTabSwitch('dialogues');
    openDialogueStudio();
    return;
  }
  if (tabName === 'scenes' || tabName === 'escenas' || tabName === 'escena') {
    animateTabSwitch('scenes');
    openScenesStudio();
    return;
  }
  const modal = document.getElementById('drawerModal');
  const titleEl = document.getElementById('drawerModalTitle');
  const bodyEl = document.getElementById('drawerModalBody');
  if (!modal || !titleEl || !bodyEl) return;
  const reopen = (t: string) => openWorkspaceTab(t);
  if (tabName === 'nodes') renderNodesTab(modal, titleEl, bodyEl, reopen, tabName);
  else if (tabName === 'assets') renderAssetsTab(modal, titleEl, bodyEl, reopen, tabName);
  else if (tabName === 'timeline') renderTimelineTab(modal, titleEl, bodyEl, reopen, tabName);
  else if (tabName === 'characters') renderCharactersTab(modal, titleEl, bodyEl, reopen, tabName);
  else if (tabName === 'settings') renderSettingsTab(modal, titleEl, bodyEl, reopen, tabName);
}
