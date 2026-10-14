-- Supabase — SOLO auth + perfiles (el texto vive en Cloudflare D1).
-- Pégalo en Supabase Dashboard > SQL Editor > New query > Run.

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
