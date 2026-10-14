import type { Post } from '../lib/postsApi';

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - +new Date(iso)) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function PostCard({ post, onProyectar }: { post: Post; onProyectar: (id: string) => void }) {
  return (
    <article className="post">
      <div className="avatar">{post.author_name.slice(0, 1).toUpperCase()}</div>
      <div className="post-body">
        <div className="post-meta">
          <strong>{post.author_name}</strong>
          <span>{post.author_handle}</span>
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>
        {post.mood_tag && <span className="post-tag">#{post.mood_tag}</span>}
        <p className="post-text">{post.text}</p>
        <div className="post-actions">
          <button className="action">💬 0</button>
          <button className={`action ${post.proyectado_por_mi ? 'projected' : ''}`} onClick={() => onProyectar(post.id)} title="Me proyecté = yo también viví esto">
            🫞 {post.proyectadas} {post.proyectado_por_mi ? '· te proyectaste' : '· me proyecté'}
          </button>
          <button className="action">↗</button>
        </div>
      </div>
    </article>
  );
}
