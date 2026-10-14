/**
 * Me Proyecté — Cloudflare Worker + D1 (guarda el texto).
 * Supabase valida identidad (JWT), D1 guarda posts.
 *
 * Setup (desde tu PC o teléfono con Termux / GitHub Codespaces):
 *   npm i -g wrangler
 *   wrangler login
 *   wrangler d1 create me-proyecte-db
 *   -> copia el database_id a wrangler.toml
 *   wrangler d1 execute me-proyecte-db --file=workers/schema.sql
 *   wrangler secret put SUPABASE_JWT_SECRET  (el JWT secret de tu proyecto Supabase)
 *   wrangler deploy
 *
 * Endpoints:
 *   GET  /posts?limit=30
 *   POST /posts {text, mood_tag}            (Bearer Supabase JWT)
 *   POST /posts/:id/proyectar               (Bearer Supabase JWT)
 */

// @ts-nocheck
import { createRemoteJWKSet, jwtVerify } from 'jose';

let JWKS = null;

async function authUser(request, env) {
  const h = request.headers.get('Authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  try {
    // Verifica contra Supabase JWKS (rotación automática, sin secret manual)
    const supabaseUrl = env.SUPABASE_URL.replace(/\/$/, '');
    if (!JWKS) JWKS = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
    const { payload } = await jwtVerify(token, JWKS, { issuer: `${supabaseUrl}/auth/v1` });
    return payload; // { sub, email, user_metadata... }
  } catch (e) {
    return null;
  }
}

function cors(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    ...extra,
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });

    // GET /posts — público, con conteo de proyectadas
    if (url.pathname === '/posts' && request.method === 'GET') {
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '30'), 50);
      const me = await authUser(request, env);
      const { results } = await env.DB.prepare(
        `SELECT p.*, (SELECT COUNT(*) FROM proyectadas WHERE post_id = p.id) AS proyectadas,
          ${me ? 'EXISTS(SELECT 1 FROM proyectadas WHERE post_id = p.id AND user_id = ?)' : '0'} AS proyectado_por_mi
         FROM posts p ORDER BY p.created_at DESC LIMIT ?`,
      )
        .bind(...(me ? [me.sub, limit] : [limit]))
        .all();
      return Response.json({ posts: results }, { headers: cors() });
    }

    // POST /posts — requiere login
    if (url.pathname === '/posts' && request.method === 'POST') {
      const me = await authUser(request, env);
      if (!me) return Response.json({ error: 'login requerido' }, { status: 401, headers: cors() });
      const { text, mood_tag } = await request.json().catch(() => ({}));
      if (!text || typeof text !== 'string' || !text.trim() || text.length > 280)
        return Response.json({ error: 'texto inválido (1-280 chars)' }, { status: 400, headers: cors() });
      const id = crypto.randomUUID();
      const name = me.user_metadata?.username || (me.email || 'anon').split('@')[0];
      const handle = '@' + String(name).replace(/\s/g, '_').toLowerCase();
      await env.DB.prepare(
        `INSERT INTO posts (id, user_id, author_name, author_handle, text, mood_tag) VALUES (?,?,?,?,?,?)`,
      )
        .bind(id, me.sub, name, handle, text.trim().slice(0, 280), mood_tag || null)
        .run();
      return Response.json(
        { post: { id, author_name: name, author_handle: handle, text: text.trim(), mood_tag: mood_tag || null, proyectadas: 0, created_at: new Date().toISOString() } },
        { headers: cors() },
      );
    }

    // POST /posts/:id/proyectar — toggle "me proyecté"
    const m = url.pathname.match(/^\/posts\/([^/]+)\/proyectar$/);
    if (m && request.method === 'POST') {
      const me = await authUser(request, env);
      if (!me) return Response.json({ error: 'login requerido' }, { status: 401, headers: cors() });
      const postId = m[1];
      const existing = await env.DB.prepare(`SELECT 1 FROM proyectadas WHERE post_id=? AND user_id=?`)
        .bind(postId, me.sub)
        .first();
      if (existing) await env.DB.prepare(`DELETE FROM proyectadas WHERE post_id=? AND user_id=?`).bind(postId, me.sub).run();
      else await env.DB.prepare(`INSERT INTO proyectadas (post_id, user_id) VALUES (?,?)`).bind(postId, me.sub).run();
      return Response.json({ ok: true, proyectado: !existing }, { headers: cors() });
    }

    return Response.json({ error: 'not found' }, { status: 404, headers: cors() });
  },
};
