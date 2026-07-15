import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import RealizarPedido from './pages/RealizarPedido';
import Administracion from './pages/Administracion';
import ReportarPago from './pages/ReportarPago';
import Login from './pages/Login';
import { supabase } from './supabaseClient';

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

function App() {
  const location = useLocation();

  return (
    <>
      <Routes>
        <Route path="/" element={<RealizarPedido />} />
        <Route path="/pago" element={<ReportarPago />} />
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
    </>
  );
}

export default App;
