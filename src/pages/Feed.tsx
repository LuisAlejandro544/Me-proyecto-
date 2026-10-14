import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Composer from '../components/Composer';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { createPost, fetchPosts, isDemoMode, toggleProyectar, type Post } from '../lib/postsApi';

export default function FeedPage() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jwt = session?.access_token;

  const load = useCallback(async () => {
    try {
      setError(null);
      setPosts(await fetchPosts(jwt));
    } catch (e: any) {
      setError(e.message ?? 'Error cargando el feed');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => { load(); }, [load]);

  const publish = async (text: string, mood: string | null) => {
    setPosting(true);
    try {
      await createPost(jwt, text, mood);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPosting(false);
    }
  };

  const proyectar = async (id: string) => {
    try {
      setPosts(await toggleProyectar(jwt, id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Layout>
      <div className="feed-header">
        <h1>Inicio 🫞</h1>
        <p>Textos de la comunidad · {isDemoMode() ? 'modo demo local (configura VITE_POSTS_API_URL para usar Cloudflare D1)' : 'conectado a Cloudflare D1 ☁️'}</p>
      </div>
      <Composer onPublish={publish} posting={posting} />
      {error && <div style={{ margin: 16 }} className="alert alert-error">{error}</div>}
      {loading ? (
        <><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></>
      ) : posts.length === 0 ? (
        <div className="empty">
          <div className="big">🫠</div>
          <b>Nadie se ha proyectado aún</b>
          <p>Sé la primera persona en desahogarse arriba.</p>
        </div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} onProyectar={proyectar} />)
      )}
    </Layout>
  );
}
