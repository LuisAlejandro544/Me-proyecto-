<script lang="ts">
  import { onMount, tick } from 'svelte';
  import StudioShell from './components/StudioShell.svelte';
  import MainMenu from './components/MainMenu.svelte';
  import CompositionStudio from './components/CompositionStudio.svelte';
  import { parseShareHash } from './lib/studio/ui/share';

  let showMenu = true;
  let showComposer = false;
  let ready = false;

  function hasSharedLevel(): boolean {
    try {
      return !!parseShareHash();
    } catch {
      return false;
    }
  }

  onMount(() => {
    // Si la URL trae un nivel compartido (#nivel=…), se salta el menú y va directo a jugar.
    if (hasSharedLevel()) showMenu = false;
    const goHome = () => {
      showMenu = true;
    };
    const openComposer = () => {
      showComposer = true;
    };
    const closeComposer = () => {
      showComposer = false;
    };
    window.addEventListener('vn:go-home', goHome);
    window.addEventListener('vn:open-composer', openComposer);
    window.addEventListener('vn:close-composer', closeComposer);
    ready = true;
    return () => {
      window.removeEventListener('vn:go-home', goHome);
      window.removeEventListener('vn:open-composer', openComposer);
      window.removeEventListener('vn:close-composer', closeComposer);
    };
  });

  async function handleEnter() {
    showMenu = false;
    // El editor estaba oculto (rects a cero): repinta con el DOM ya visible.
    await tick();
    try {
      (window as unknown as { __studio?: { enterEditor?: () => void } }).__studio?.enterEditor?.();
    } catch {}
  }
</script>

<!-- El shell del editor vive siempre montado (initStudio cablea una sola vez);
     el menú lo tapa hasta elegir historia. -->
<div style={showMenu ? 'display:none' : ''}>
  <StudioShell />
</div>

{#if ready && showMenu && !hasSharedLevel()}
  <MainMenu onEnter={handleEnter} />
{/if}

<!-- Editor de composición: pantalla completa independiente (no es un popup del drawer). -->
{#if showComposer && !showMenu}
  <CompositionStudio />
{/if}
