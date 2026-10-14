import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginPage, RegisterPage } from './pages/Auth';
import FeedPage from './pages/Feed';

function Guard({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty"><div className="big">🫞</div><p>Cargando tu proyección…</p></div>;
  // Permitimos ver el feed en demo sin login, pero si hay Supabase
  // configurado exigimos sesión. Si no hay env, dejamos pasar.
  const needsAuth = Boolean(import.meta.env.VITE_SUPABASE_URL);
  if (needsAuth && !user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/" element={<Guard><FeedPage /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
