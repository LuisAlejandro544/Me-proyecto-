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
.github/workflows/deploy-cloudflare-pages.yml  deploy auto a Cloudflare Pages
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

## 4) Publicar en Cloudflare Pages (automático en cada push a main)

**Opción A — con GitHub Actions (recomendado, ya configurado):**

1. En Cloudflare Dashboard → **Workers & Pages → Create → Pages** → conecta tu repo una vez
   (o crea el proyecto `me-proyecte` vacío). Copia el **Account ID**.
2. Crea un API Token: **My Profile → API Tokens → Create Token → Edit Cloudflare Workers**
   (permiso `Cloudflare Pages:Edit` + `Workers Scripts:Edit`). Cópialo.
3. GitHub → tu repo → **Settings → Secrets → Actions** → crea:
   * `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_POSTS_API_URL`
   * `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
4. Haz push a `main` o **Actions → Deploy a Cloudflare Pages → Run workflow**.
   Compila con `VITE_BASE_PATH=/` y sube `dist/` con
   `wrangler pages deploy dist --project-name=me-proyecte`.
   Tu web queda en `https://me-proyecte.pages.dev`.

**Opción B — solo con el dashboard de Cloudflare (sin secrets):**

1. **Workers & Pages → Create → Pages → Connect to Git** → elige tu repo.
2. Build settings: **Framework: Vite**, **Build command: `npm run build`**,
   **Output: `dist`**, **Node 20**.
3. Environment variables (Production): `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`, `VITE_POSTS_API_URL`, `VITE_BASE_PATH=/`.
4. **Save and Deploy**. Cada push a `main` redespliega solo.

> SPA: `public/_redirects` ya tiene `/* /index.html 200` para que
> `/login` y `/registro` funcionen al recargar.

## Notas Expo / móvil
La web es el MVP. Para móvil con Expo: `npx create-expo-app`, reutiliza `AuthContext`, `postsApi.ts` y los tokens de `index.css` vía NativeWind. El backend (Supabase + Worker D1) ya sirve a ambas.
