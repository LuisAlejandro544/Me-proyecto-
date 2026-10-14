-- Cloudflare D1 — guarda el TEXTO (Supabase solo hace login).
-- Ejecutar con: npx wrangler d1 execute me-proyecte-db --file=workers/schema.sql
-- Requiere haber creado la DB: npx wrangler d1 create me-proyecte-db

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,          -- sub del JWT de Supabase
  author_name TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  text TEXT NOT NULL CHECK (length(text) <= 280),
  mood_tag TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS proyectadas (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proy_post ON proyectadas(post_id);
