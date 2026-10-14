import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cloudflare Pages: se sirve desde la raíz '/', así que base debe ser '/'.
// Se puede overridear con VITE_BASE_PATH (ej: '/Me-proyecto-/' para GitHub Pages
// o './' para dominio custom con rutas relativas). Por defecto '/' para Cloudflare.
const rawBase = process.env.VITE_BASE_PATH ?? '/';
const base = rawBase === 'custom' ? './' : rawBase;

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});
