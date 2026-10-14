import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Hero() {
  return (
    <div className="auth-hero">
      <div className="brand">
        <div className="brand-mark">🫞</div>
        <div>Me Proyecté<small>la red de los proyectados</small></div>
      </div>
      <h1>Si te <em>proyectaste</em>, este es tu lugar.</h1>
      <p>
        El X confesional de TikTok: publica textos de 280 caracteres, ponle mood
        (#ansiedad, #3am, #desahogo) y deja que otros digan <b>"me proyecté"</b> en
        vez de un like frío. Sin fotos perfectas. Puro desahogo.
      </p>
      <div className="hero-badges">
        <span className="hero-badge">🫞 Me proyecté = yo también lo viví</span>
        <span className="hero-badge">🔐 Login con Supabase</span>
        <span className="hero-badge">☁️ Textos en Cloudflare D1</span>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setErr(error);
    else nav('/');
  };

  return (
    <div className="auth-wrap">
      <Hero />
      <div className="auth-form-side">
        <form className="form-card" onSubmit={submit}>
          <h2>Bienvenidx de vuelta 🫠</h2>
          <p>Inicia sesión para proyectarte con la comunidad.</p>
          {err && <div className="alert alert-error">{err}</div>}
          <div className="field"><label>Correo</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" /></div>
          <div className="field"><label>Contraseña</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Entrando…' : 'Iniciar sesión'}</button>
          <div className="divider">o</div>
          <button type="button" className="btn btn-ghost" style={{ width: '100%' }} onClick={() => signInWithGoogle()}>🔵 Entrar con Google</button>
          <p className="form-switch">¿Nueva por aquí? <Link to="/registro">Crea tu cuenta</Link></p>
        </form>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { signUp } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) { setErr('El usuario debe tener al menos 3 caracteres.'); return; }
    if (password.length < 6) { setErr('La contraseña debe tener al menos 6 caracteres.'); return; }
    setBusy(true);
    setErr(null);
    const { error } = await signUp(email.trim(), password, username.trim());
    setBusy(false);
    if (error) setErr(error);
    else setOk(true);
  };

  return (
    <div className="auth-wrap">
      <Hero />
      <div className="auth-form-side">
        <form className="form-card" onSubmit={submit}>
          <h2>Únete a los proyectados 🫞</h2>
          <p>Cuenta gratis. Solo texto. Cero poses.</p>
          {err && <div className="alert alert-error">{err}</div>}
          {ok && <div className="alert alert-ok">¡Cuenta creada! Revisa tu correo para confirmar y luego <Link to="/login">inicia sesión</Link>.</div>}
          <div className="field"><label>Usuario (sin espacios)</label><input required value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} placeholder="vale_proyectada" /></div>
          <div className="field"><label>Correo</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" /></div>
          <div className="field"><label>Contraseña (mín. 6)</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
          <button className="btn btn-primary" disabled={busy || ok}>{busy ? 'Creando…' : 'Crear cuenta'}</button>
          <p className="form-switch">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
          <p className="form-switch"><Link to="/">← ver demo sin cuenta</Link></p>
        </form>
      </div>
    </div>
  );
}
