<script lang="ts">
  import { onMount } from 'svelte';
  import { initStudio } from '../lib/studio';

  onMount(() => {
    initStudio();
    // Motores sin compositor Chromium (WebKitGTK en Tauri/C++): los fades
    // dentro de tarjetas con backdrop-filter parpadean; se muestran al instante.
    try {
      if (!(window as unknown as { chrome?: unknown }).chrome)
        document.body.classList.add('fx-instant');
    } catch {}
  });
  import BottomNav from './BottomNav.svelte';
  import CanvasChrome from './CanvasChrome.svelte';
  import DrawerModal from './DrawerModal.svelte';
  import PlaytestModal from './PlaytestModal.svelte';
  import ShareLoading from './ShareLoading.svelte';
  import TextEditorPanel from './TextEditorPanel.svelte';
  import ToastBanner from './ToastBanner.svelte';
  import TopBar from './TopBar.svelte';
  import UpdateModal from './UpdateModal.svelte';
</script><!-- Ported body markup (ids preserved so lib/studio.ts keeps working) -->
<!-- Original <body> classes restored: flex column fills viewport, main flex-1 gets height -->
<div class="flex flex-col h-screen w-screen overflow-hidden select-none">
  <TopBar />
  <CanvasChrome />
  <BottomNav />
  <DrawerModal />
  <PlaytestModal />
  <ShareLoading />
  <TextEditorPanel />
  <ToastBanner />
  <UpdateModal />
</div>
