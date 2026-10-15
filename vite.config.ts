import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Tauri + Capacitor share the same web build (dist/).
// - Tauri loads dist/ via file://
// - Capacitor copies dist/ to android/ios via `npx cap sync`
export default defineConfig({
  plugins: [svelte()],
  clearScreen: false,
  // Relative asset paths: dist/ must also load over file:// (C++ shell, Capacitor).
  base: './',
  server: {
    port: 1420,
    strictPort: true
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    outDir: 'dist',
    target: process.env.TAURI_PLATFORM ? 'chrome105' : 'esnext',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG
  }
});
