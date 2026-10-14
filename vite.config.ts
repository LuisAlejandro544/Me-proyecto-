import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages: si el repo es https://usuario.github.io/Me-proyecto-/
// hay que servir desde /Me-proyecto-/. Para dominio custom o
// Cloudflare Pages deja base en './'.
// Se lee de env VITE_BASE_PATH, por defecto '/Me-proyecto-/' para Pages.
const base = process.env.VITE_BASE_PATH ?? '/Me-proyecto-/';

export default defineConfig({
  plugins: [react()],
  base: base === 'custom' ? './' : base,
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});
