<script lang="ts">
  import { onMount, tick } from 'svelte';
  import StudioShell from './components/StudioShell.svelte';
  import MainMenu from './components/MainMenu.svelte';
  import { parseShareHash } from './lib/studio/ui/share';

  let showMenu = true;
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
    window.addEventListener('vn:go-home', goHome);
    ready = true;
    return () => window.removeEventListener('vn:go-home', goHome);
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
