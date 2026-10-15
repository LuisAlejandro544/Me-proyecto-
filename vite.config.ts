import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'node:fs';

function appVersion(): string {
  try {
    return JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version ?? '0.1.0';
  } catch {
    return '0.1.0';
  }
}

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
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION ?? appVersion())
  },
  build: {
    outDir: 'dist',
    target: process.env.TAURI_PLATFORM ? 'chrome105' : 'esnext',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG
  }
});
