import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const handle = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'tú';

  const logout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">🫞</div>
          <div>
            Me Proyecté
            <small>donde proyectarse está bien</small>
          </div>
        </div>
        <Link className="nav-link active" to="/"> <span className="ico">🏠</span> Inicio</Link>
        <Link className="nav-link" to="/"> <span className="ico">🔥</span> Proyectados</Link>
        <Link className="nav-link" to="/"> <span className="ico">👤</span> Perfil</Link>
        <Link className="nav-link" to="/"> <span className="ico">🔔</span> Avisos</Link>
        <button className="btn btn-primary" onClick={() => document.getElementById('composer-box')?.focus()}>
          ✍️ Proyectar
        </button>
        <div className="user-chip">
          <div className="avatar">{handle.slice(0, 1).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{handle}</div>
            <div style={{ fontSize: 12, color: 'var(--faint)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={logout}>Salir</button>
        </div>
      </aside>

      <main className="feed">{children}</main>

      <aside className="trends">
        <div className="card">
          <h3>✨ Moods en tendencia</h3>
          {[
            ['#ansiedad', '12,4 mil proyecciones'],
            ['#3am', '8,1 mil proyecciones'],
            ['#desahogo', '6,7 mil proyecciones'],
            ['#losercore', '5,2 mil proyecciones'],
            ['#bienproyectada', '3,9 mil proyecciones'],
          ].map(([tag, n]) => (
            <div className="trend-row" key={tag}><b>{tag}</b><span>{n}</span></div>
          ))}
        </div>
        <div className="card">
          <h3>🫂 ¿Qué es proyectarse?</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
            Cuando un video o texto describe exactamente lo que vives. Aquí no damos like:
            damos <b style={{ color: 'var(--accent-soft)' }}>Me proyecté</b> = "yo también viví esto".
          </p>
        </div>
      </aside>

      <nav className="mobile-nav">
        <Link to="/">🏠</Link>
        <Link to="/">🔥</Link>
        <Link to="/">👤</Link>
      </nav>
    </div>
  );
}
