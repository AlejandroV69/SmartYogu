import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import ReportarPago from './pages/ReportarPago';
import { supabase } from './supabaseClient';

// Lazy loading de componentes pesados para optimizar el tiempo de carga en Safari
const Administracion = lazy(() => import('./pages/Administracion'));
const Login = lazy(() => import('./pages/Login'));

// Componente para proteger rutas
function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="h-screen bg-surface flex items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
      </div>
    );
  }

  if (!session) {
    // Si no hay sesión, mandamos al Login
    return <Navigate to="/login" replace />;
  }

  // Si hay sesión, mostramos la pantalla
  return children;
}

// Fallback de carga bonito para los componentes diferidos
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface-variant">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
        <p className="text-sm font-medium text-on-surface-variant/70 animate-pulse">Cargando...</p>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<ReportarPago />} />
        <Route path="/pago" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Administracion />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;

