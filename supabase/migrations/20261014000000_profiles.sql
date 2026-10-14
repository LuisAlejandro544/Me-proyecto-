-- Migración inicial: tabla profiles (solo auth + perfiles, el texto vive en D1).
-- Esta carpeta `supabase/migrations/` es la que lee la integración GitHub de Supabase
-- ("Update your schema in code and push it to GitHub. Supabase deploys the changes").
-- Si conectaste el repo en el dashboard (como en tu captura), cada push a main
-- con cambios aquí se aplica solo a tu base de datos. Sin esta carpeta, esa
-- conexión no hace nada.
--
-- Para aplicar en local / manual: pega este archivo en SQL Editor > Run.
-- Equivalente a supabase/schema.sql (se mantiene ambos sincronizados).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "perfiles visibles para todos" on public.profiles;
create policy "perfiles visibles para todos"
  on public.profiles for select using (true);

drop policy if exists "cada usuario edita su perfil" on public.profiles;
create policy "cada usuario edita su perfil"
  on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
