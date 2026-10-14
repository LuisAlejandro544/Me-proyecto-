// Cliente Supabase — SOLO auth + perfiles.
// Los posts (texto) NO van aquí: van a Cloudflare D1 vía Worker.
// Ver src/lib/postsApi.ts y /workers/api.js
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.warn(
    '[supabase] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copia .env.example a .env.local',
  );
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'me-proyecte-auth',
  },
});
