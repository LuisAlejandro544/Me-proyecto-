# 🫞 Me Proyecté — red social confesional (estilo X, solo texto)

**Stack:** TypeScript + React + React Router + CSS (tokens listos para Tailwind/NativeWind en Expo) · **Login:** Supabase Auth · **Textos:** Cloudflare D1 vía Worker.

## Paleta
| Rol | Color | Uso |
|---|---|---|
| Fondo | `#0B0713` / `#140E24` | noche violeta |
| Card | `#1A1230` | posts, formularios |
| Primario | `#8B5CF6 → #EC4899` | botones, glow |
| Acento frío | `#22D3EE` | links, tags #mood |
| Texto / muted | `#F5F3FF` / `#B8A9E0` | legibilidad Gen-Z nocturna |

Fuente display: **Sora**, cuerpo: **Inter**.

## Estructura
```
src/
  App.tsx               rutas /login /registro /
  main.tsx              BrowserRouter + AuthProvider
  index.css             design system (colores, layout X 3 col)
  context/AuthContext.tsx  login, registro, Google, logout (Supabase)
  lib/supabaseClient.ts    SOLO auth+perfiles
  lib/postsApi.ts          posts → Cloudflare Worker (o demo localStorage)
  components/Layout.tsx Composer.tsx PostCard.tsx
  pages/Auth.tsx  Feed.tsx
workers/
  api.js                Worker que valida JWT Supabase y lee/escribe D1
  schema.sql            tablas posts + proyectadas (D1/SQLite)
  wrangler.toml.example config ejemplo
supabase/schema.sql     tabla profiles + RLS (auth)
.github/workflows/deploy-pages-manual.yml  deploy MANUAL a Pages
```

## 1) Configurar Supabase (login)
1. Crea proyecto en [supabase.com](https://supabase.com) → copia `Project URL` y `anon public key`.
2. En Supabase → SQL Editor → pega `supabase/schema.sql` → Run.
3. Auth → Providers → activa **Email** y **Google** (para Google: pon Client ID/Secret de Google Cloud).
4. Crea `.env.local` desde `.env.example` y rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## 2) Configurar Cloudflare D1 (textos)
```bash
npm i -g wrangler
wrangler login
wrangler d1 create me-proyecte-db
# pega el database_id en workers/wrangler.toml (copia desde wrangler.toml.example)
wrangler d1 execute me-proyecte-db --file=workers/schema.sql --remote
wrangler deploy --cwd workers
# copia la URL https://me-proyecte-api.xxxx.workers.dev → VITE_POSTS_API_URL
```
Sin esto la app funciona en **modo demo** (localStorage) para probar el diseño.

## 3) Correr en local
```bash
npm install
npm run dev   # http://localhost:5173
```

## 4) Publicar en GitHub Pages CUANDO TÚ DECIDAS (no en cada commit)
El workflow `deploy-pages-manual.yml` usa **solo `workflow_dispatch`**: ningún `push` lo dispara.

**Activarlo una vez (5 min):**
1. GitHub → tu repo → **Settings → Pages** → *Build and deployment* → **Source: GitHub Actions**.
2. **Settings → Secrets → Actions → New secret**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_POSTS_API_URL`.
3. Ve a **Actions → "Deploy manual a Pages" → Run workflow → Run workflow** cuando quieras publicar.
4. Tu web quedará en `https://tu-usuario.github.io/Me-proyecto-/`.

**¿Por qué no se actualiza con cada commit?** Porque el YAML no tiene `on: push`. Solo el botón manual lo lanza. Si algún día quieres auto-deploy, añade:
```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

## Notas Expo / móvil
La web es el MVP. Para móvil con Expo: `npx create-expo-app`, reutiliza `AuthContext`, `postsApi.ts` y los tokens de `index.css` vía NativeWind. El backend (Supabase + Worker D1) ya sirve a ambas.
