import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import RealizarPedido from './pages/RealizarPedido';
import Administracion from './pages/Administracion';
import ReportarPago from './pages/ReportarPago';

function App() {
  const location = useLocation();

  return (
    <>
      <Routes>
        <Route path="/" element={<RealizarPedido />} />
        <Route path="/admin" element={<Administracion />} />
        <Route path="/pago" element={<ReportarPago />} />
      </Routes>
      
      {/* Dev Navigation to switch screens easily */}
      <div className="fixed bottom-2 right-2 bg-surface-container-highest p-2 rounded-lg border border-outline-variant opacity-50 hover:opacity-100 transition-opacity z-[1000] text-xs flex gap-2">
        <Link to="/" className={location.pathname === '/' ? 'text-primary' : 'text-on-surface'}>Pedido</Link>
        <Link to="/admin" className={location.pathname === '/admin' ? 'text-primary' : 'text-on-surface'}>Admin</Link>
        <Link to="/pago" className={location.pathname === '/pago' ? 'text-primary' : 'text-on-surface'}>Pago</Link>
      </div>
    </>
  );
}

export default App;
