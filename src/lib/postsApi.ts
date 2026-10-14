// API de posts — Cloudflare D1 vía Worker.
// Supabase guarda identidad; Cloudflare guarda el texto.
// Worker esperado (ver /workers/api.js):
//   GET  {API}/posts?limit=30            -> lista
//   POST {API}/posts {text, mood_tag}    -> crea (requiere Bearer Supabase JWT)
//   POST {API}/posts/:id/proyectar       -> "me proyecté" (requiere Bearer)
// Si VITE_POSTS_API_URL no existe, usa modo demo local (localStorage)
// para que la UI se pueda probar sin backend.

export interface Post {
  id: string;
  author_name: string;
  author_handle: string;
  text: string;
  mood_tag: string | null;
  proyectadas: number;
  proyectado_por_mi?: boolean;
  created_at: string;
}

const API = (import.meta.env.VITE_POSTS_API_URL as string | undefined)?.replace(/\/$/, '');
const LS_KEY = 'me-proyecte-demo-posts';

function demoSeed(): Post[] {
  return [
    {
      id: 'demo-1',
      author_name: 'vale.jpg',
      author_handle: '@vale_proyectada',
      text: 'POV: sales con ansiedad social y finges que estás ocupada con el celular para no saludar. Me proyecté x1000 🫠',
      mood_tag: 'ansiedad',
      proyectadas: 342,
      proyectado_por_mi: false,
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: 'demo-2',
      author_name: 'matías.exe',
      author_handle: '@mati_loser',
      text: 'Nadie:\nAbsolutamente nadie:\nYo a las 3am: ¿y si todos me odian en secreto?',
      mood_tag: '3am',
      proyectadas: 518,
      proyectado_por_mi: true,
      created_at: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    },
    {
      id: 'demo-3',
      author_name: 'lunita',
      author_handle: '@lunita_sad',
      text: 'bien proyectada con ese tiktok de "no tengo amigos, tengo conocidos". Duele pero es verdad.',
      mood_tag: 'desahogo',
      proyectadas: 129,
      proyectado_por_mi: false,
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
  ];
}

function readDemo(): Post[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      const seed = demoSeed();
      localStorage.setItem(LS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Post[];
  } catch {
    return demoSeed();
  }
}

function writeDemo(posts: Post[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(posts));
}

export const isDemoMode = () => !API;

export async function fetchPosts(jwt?: string): Promise<Post[]> {
  if (!API) return readDemo().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const res = await fetch(`${API}/posts?limit=30`, {
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
  });
  if (!res.ok) throw new Error(`Error cargando posts (${res.status})`);
  const data = await res.json();
  return data.posts as Post[];
}

export async function createPost(jwt: string | undefined, text: string, mood_tag: string | null): Promise<Post> {
  if (!API) {
    const post: Post = {
      id: `demo-${Date.now()}`,
      author_name: 'tú',
      author_handle: '@tu_usuario',
      text,
      mood_tag,
      proyectadas: 0,
      proyectado_por_mi: false,
      created_at: new Date().toISOString(),
    };
    writeDemo([post, ...readDemo()]);
    return post;
  }
  if (!jwt) throw new Error('Necesitas iniciar sesión para publicar.');
  const res = await fetch(`${API}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ text: text.slice(0, 280), mood_tag }),
  });
  if (!res.ok) throw new Error('No se pudo publicar. Intenta de nuevo.');
  return (await res.json()).post as Post;
}

export async function toggleProyectar(jwt: string | undefined, id: string): Promise<Post[]> {
  if (!API) {
    const next = readDemo().map((p) =>
      p.id === id
        ? {
            ...p,
            proyectado_por_mi: !p.proyectado_por_mi,
            proyectadas: p.proyectadas + (p.proyectado_por_mi ? -1 : 1),
          }
        : p,
    );
    writeDemo(next);
    return next.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }
  if (!jwt) throw new Error('Inicia sesión para dar Me proyecté.');
  const res = await fetch(`${API}/posts/${id}/proyectar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error('No se pudo registrar tu proyección.');
  return fetchPosts(jwt);
}
