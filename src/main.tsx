import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

const basename = (() => {
  const raw = import.meta.env.VITE_BASE_PATH as string | undefined;
  if (!raw || raw === '/' || raw === 'custom' || raw === './') return '/';
  // '/Me-proyecto-/' -> '/Me-proyecto-' (basename sin trailing slash)
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
