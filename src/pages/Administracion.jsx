import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Administracion() {
  const navigate = useNavigate();
  // ── UI state ─────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRecibo, setModalRecibo] = useState(null); // pedido seleccionado para ver recibo
  const [addFlavorModalOpen, setAddFlavorModalOpen] = useState(false);
  const [editFlavorModalOpen, setEditFlavorModalOpen] = useState(false);
  const [addVariantModalOpen, setAddVariantModalOpen] = useState(false);
  const [selectedFlavorForVariant, setSelectedFlavorForVariant] = useState('');
  const [flavorToEdit, setFlavorToEdit] = useState(null);
  const [newFlavor, setNewFlavor] = useState({ sabor: '', presentacion: '', precio: '', stock: '' });
  const [newVariant, setNewVariant] = useState({ presentacion: '', precio: '', stock: '' });
  const [savingFlavor, setSavingFlavor] = useState(false);

  // ── Datos ─────────────────────────────────────────────────────────
  const [inventario, setInventario] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loadingInv, setLoadingInv] = useState(true);
  const [loadingPed, setLoadingPed] = useState(true);
  const [error, setError] = useState(null);

  // ── GET: inventario ──────────────────────────────────────────────
  useEffect(() => {
    async function fetchInventario() {
      setLoadingInv(true);
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('sabor');

      if (error) {
        console.error('Error cargando inventario:', error.message);
        setError('No se pudo cargar el inventario.');
      } else {
        setInventario(data || []);
      }
      setLoadingInv(false);
    }
    fetchInventario();
  }, []);

  // ── GET: pedidos (cola de verificación) ──────────────────────────
  useEffect(() => {
    async function fetchPedidos() {
      setLoadingPed(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, cliente_nombre, total, estado, comprobante_url, created_at, numero_transaccion')
        .in('estado', ['Pago por Verificar', 'Pendiente por Pago'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando pedidos:', error.message);
      } else {
        setPedidos(data || []);
      }
      setLoadingPed(false);
    }
    fetchPedidos();
  }, []);

  // ── UPDATE: stock de inventario (+/-) ────────────────────────────
  const updateStock = async (producto, delta) => {
    const nuevoStock = Math.max(0, producto.stock + delta);

    // Actualización optimista en el estado local
    setInventario((prev) =>
      prev.map((p) => (p.id === producto.id ? { ...p, stock: nuevoStock } : p))
    );

    const { data, error, status, statusText } = await supabase
      .from('inventario')
      .update({ stock: nuevoStock })
      .eq('id', producto.id)
      .select();

    if (error) {
      console.error('Error actualizando stock:', error.message);
      // Revertir el cambio local si falla
      setInventario((prev) =>
        prev.map((p) => (p.id === producto.id ? { ...p, stock: producto.stock } : p))
      );
      setError(`Error ${status || 'Desconocido'} al actualizar stock: ${error.message}`);
    } else {
      if (!data || data.length === 0) {
        setInventario((prev) =>
          prev.map((p) => (p.id === producto.id ? { ...p, stock: producto.stock } : p))
        );
        setError('El servidor no actualizó el registro. Probable causa: RLS de Supabase está activo y bloqueando escrituras.');
      }
    }
  };

  // ── UPDATE: cambiar estado de un pedido ──────────────────────────
  const cambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    // Actualización optimista
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
    );

    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoId);

    if (error) {
      console.error('Error actualizando pedido:', error.message);
      setError(`No se pudo actualizar el pedido: ${error.message}`);
      // No revertimos el estado para no confundir — recarga de página lo arregla
    } else {
      // Quitar de la cola si fue Aprobado o Rechazado
      if (nuevoEstado === 'Aprobado' || nuevoEstado === 'Rechazado') {
        setTimeout(() => {
          setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
        }, 600);
      }
    }
  };

  // ── POST: añadir nueva presentación a un sabor existente ───────────
  const handleAddVariant = async (e) => {
    e.preventDefault();
    setSavingFlavor(true);

    const { data, error } = await supabase
      .from('inventario')
      .insert([{
        sabor: selectedFlavorForVariant,
        presentacion: newVariant.presentacion,
        precio: parseFloat(newVariant.precio),
        stock: parseInt(newVariant.stock, 10),
      }])
      .select();

    if (error) {
      console.error('Error añadiendo presentación:', error.message);
      setError(`No se pudo añadir la presentación: ${error.message}`);
    } else if (data) {
      setInventario((prev) => [...prev, data[0]]);
      setAddVariantModalOpen(false);
      setNewVariant({ presentacion: '', precio: '', stock: '' });
    }
    setSavingFlavor(false);
  };

  // ── POST: añadir nuevo sabor ───────────────────────────────────────
  const handleAddFlavor = async (e) => {
    e.preventDefault();
    setSavingFlavor(true);

    const { data, error } = await supabase
      .from('inventario')
      .insert([{
        sabor: newFlavor.sabor,
        presentacion: newFlavor.presentacion,
        precio: parseFloat(newFlavor.precio),
        stock: parseInt(newFlavor.stock, 10),
      }])
      .select();

    if (error) {
      console.error('Error añadiendo sabor:', error.message);
      setError(`No se pudo añadir el sabor: ${error.message}`);
    } else if (data) {
      // Actualización optimista
      setInventario((prev) => [...prev, data[0]].sort((a, b) => a.sabor.localeCompare(b.sabor)));
      setAddFlavorModalOpen(false);
      setNewFlavor({ sabor: '', presentacion: '', precio: '', stock: '' });
    }
    setSavingFlavor(false);
  };

  // ── UPDATE: editar sabor ───────────────────────────────────────────
  const handleEditFlavor = async (e) => {
    e.preventDefault();
    setSavingFlavor(true);

    const { data, error } = await supabase
      .from('inventario')
      .update({
        sabor: flavorToEdit.sabor,
        presentacion: flavorToEdit.presentacion,
        precio: parseFloat(flavorToEdit.precio),
        stock: parseInt(flavorToEdit.stock, 10),
      })
      .eq('id', flavorToEdit.id)
      .select();

    if (error) {
      console.error('Error editando sabor:', error.message);
      setError(`No se pudo editar el sabor: ${error.message}`);
    } else if (data && data.length > 0) {
      setInventario((prev) => prev.map(p => p.id === flavorToEdit.id ? data[0] : p).sort((a, b) => a.sabor.localeCompare(b.sabor)));
      setEditFlavorModalOpen(false);
      setFlavorToEdit(null);
    } else {
       setError('El servidor no actualizó el registro. Probable causa: RLS de Supabase está activo y bloqueando escrituras.');
    }
    setSavingFlavor(false);
  };

  const getInventarioAgrupado = () => {
    const agrupado = inventario.reduce((acc, item) => {
      if (!acc[item.sabor]) {
        acc[item.sabor] = {
          sabor: item.sabor,
          variantes: []
        };
      }
      acc[item.sabor].variantes.push(item);
      return acc;
    }, {});
    return Object.values(agrupado).sort((a, b) => a.sabor.localeCompare(b.sabor));
  };

  // ── Helpers UI ───────────────────────────────────────────────────
  const getStockColor = (stock) => {
    if (stock <= 10) return 'bg-error';
    if (stock <= 30) return 'bg-tertiary';
    return 'bg-primary';
  };

  const getStockWidth = (stock) => {
    const pct = Math.min((stock / 200) * 100, 100);
    return `${pct}%`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('es-VE', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const getEstadoBadge = (estado) => {
    if (estado === 'Aprobado') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (estado === 'Rechazado') return 'bg-error/20 text-error border-error/30';
    if (estado === 'Pago por Verificar') return 'bg-tertiary/20 text-tertiary border-tertiary/30';
    return 'bg-surface-container-highest text-on-surface-variant border-outline-variant';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      {/* Overlay móvil del sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* NavigationDrawer */}
      <aside
        className={`fixed left-0 top-0 h-full w-60 bg-surface-container-low border-r border-outline-variant flex flex-col z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0`}
        style={{ padding: '24px 0' }}
      >
        <div className="px-4 mb-8 flex items-center gap-3">
          <img src="/favicon.png" alt="THÖRGURT Logo" className="w-10 h-10 object-contain drop-shadow-md" />
          <h1 className="text-primary tracking-tight font-bold text-2xl">THÖRGURT Admin</h1>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {[
            { icon: 'dashboard', label: 'Inicio', id: 'Dashboard' },
            { icon: 'inventory_2', label: 'Inventario', id: 'Inventory' },
            { icon: 'verified_user', label: 'Verificación', id: 'Verification' },
            { icon: 'settings', label: 'Configuración', id: 'Settings' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-2 transition-all duration-200 rounded-lg ${isActive
                  ? 'text-primary font-bold border-r-4 border-primary bg-surface-container-high rounded-l-lg'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                  }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto px-4 pt-6 pb-6 border-t border-outline-variant">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
                AV
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">Alejandro Viana</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Master Access</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-error hover:bg-error-container p-2 rounded-full transition-colors flex items-center justify-center active:scale-90"
              title="Cerrar Sesión"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 ml-0 md:ml-60 overflow-y-auto bg-surface-dim">
        {/* TopAppBar */}
        <header className="sticky top-0 w-full z-30 bg-surface border-b border-outline-variant flex justify-between items-center px-4 md:px-8 h-16">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              className="text-on-surface-variant hover:bg-surface-container-highest p-2 rounded-full transition-colors md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="font-semibold text-xl md:text-2xl text-primary">Panel de Control</h2>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden md:flex items-center bg-surface-container px-4 py-1 rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-on-surface-variant text-sm mr-1">search</span>
              <input
                className="bg-transparent border-none focus:outline-none text-sm text-on-surface w-48"
                placeholder="Buscar pedido o sabor..."
                type="text"
              />
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-primary text-xl">account_circle</span>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 space-y-8 max-w-[1440px] mx-auto">
          {/* Error global */}
          {error && (
            <div className="p-4 bg-error-container/30 border border-error/40 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-error">error</span>
              <p className="text-sm text-error flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-error hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* Hero */}
          <section className="relative h-40 md:h-48 rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant">
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-transparent to-transparent"></div>
            <div className="relative z-10 p-6 flex flex-col justify-end h-full">
              <p className="text-primary font-bold text-xs uppercase tracking-tighter mb-1">Resumen Operativo</p>
              <h1 className="font-extrabold text-3xl md:text-5xl text-on-surface leading-none">
                Panel Principal
              </h1>
            </div>
          </section>

          {/* ── Sección 1: Inventario ─────────────────────────────── */}
          {(activeTab === 'Dashboard' || activeTab === 'Inventory') && (
            <section id="inventory">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="font-semibold text-xl md:text-2xl text-on-surface">Inventario de Sabores</h3>
                  <p className="text-on-surface-variant text-sm font-medium">Gestión de stock en tiempo real</p>
                </div>
                <button
                  className="bg-primary text-on-primary px-4 md:px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 active:scale-95 transition-all shadow-lg hover:brightness-110"
                  onClick={() => setAddFlavorModalOpen(true)}
                >
                  <span className="material-symbols-outlined">add</span>
                  <span className="hidden md:inline">Añadir Sabor</span>
                </button>
              </div>

              {loadingInv ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-48 bg-surface-container rounded-xl animate-pulse border border-outline-variant" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getInventarioAgrupado().map((grupo) => (
                    <div
                      key={grupo.sabor}
                      className="bento-card bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-xl text-primary flex items-center gap-2">
                          {grupo.sabor}
                        </h4>
                        <button
                          className="bg-surface-container-highest p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors flex items-center justify-center"
                          onClick={() => { setSelectedFlavorForVariant(grupo.sabor); setAddVariantModalOpen(true); }}
                          title={`Añadir presentación a ${grupo.sabor}`}
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        {grupo.variantes.map((item) => (
                          <div key={item.id} className="bg-surface-container-low border border-outline-variant rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="text-sm font-bold text-on-surface">{item.presentacion}</span>
                                <span className="text-xs text-on-surface-variant ml-2">${Number(item.precio).toFixed(2)}</span>
                              </div>
                              <button 
                                className="text-on-surface-variant hover:text-primary transition-colors p-1"
                                onClick={() => { setFlavorToEdit(item); setEditFlavorModalOpen(true); }}
                                title="Editar"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex-1">
                                <p className="text-[10px] text-on-surface-variant uppercase font-bold">Stock</p>
                                <div className="text-3xl font-extrabold text-on-surface leading-none tabular-nums tracking-tighter">
                                  {item.stock}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  className="w-8 h-8 flex items-center justify-center bg-surface-container-highest rounded-lg text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-90 border border-outline-variant"
                                  onClick={() => updateStock(item, 1)}
                                >
                                  <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                                <button
                                  className="w-8 h-8 flex items-center justify-center bg-surface-container-highest rounded-lg text-primary hover:bg-error hover:text-on-error transition-all active:scale-90 border border-outline-variant disabled:opacity-40"
                                  onClick={() => updateStock(item, -1)}
                                  disabled={item.stock === 0}
                                >
                                  <span className="material-symbols-outlined text-sm">remove</span>
                                </button>
                              </div>
                            </div>

                            <div className="flex justify-between items-center gap-3">
                              <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${getStockColor(item.stock)}`}
                                  style={{ width: getStockWidth(item.stock) }}
                                />
                              </div>
                              <span className={`text-[10px] font-bold ${item.stock <= 10 ? 'text-error' : item.stock <= 30 ? 'text-tertiary' : 'text-primary'
                                }`}>
                                {item.stock <= 10 ? 'BAJO' : item.stock <= 30 ? 'MEDIO' : 'OK'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Sección 2: Cola de Verificación ─────────────────────── */}
          {(activeTab === 'Dashboard' || activeTab === 'Verification') && (
            <section id="verification">
              <div className="mb-6">
                <h3 className="font-semibold text-xl md:text-2xl text-on-surface">Cola de Verificación</h3>
                <p className="text-on-surface-variant text-sm font-medium">
                  Validación manual de pagos y comprobantes bancarios
                </p>
              </div>

              {loadingPed ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 bg-surface-container rounded-xl animate-pulse border border-outline-variant" />
                  ))}
                </div>
              ) : pedidos.length === 0 ? (
                <div className="text-center py-12 bg-surface-container rounded-xl border border-outline-variant">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant block mb-3">inbox</span>
                  <p className="text-on-surface-variant text-sm">No hay pagos pendientes de verificación.</p>
                </div>
              ) : (
                <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-surface-container-high border-b border-outline-variant">
                        {['Cliente', 'Ref.', 'Monto', 'Fecha / Hora', 'Estado', 'Comprobante', 'Acciones'].map((h) => (
                          <th key={h} className={`px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap ${h === 'Comprobante' || h === 'Acciones' ? 'text-center' : 'text-left'}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {pedidos.map((pedido) => (
                        <tr
                          key={pedido.id}
                          className="hover:bg-surface-container-highest transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                                {pedido.cliente_nombre?.slice(0, 2).toUpperCase() || '??'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-on-surface whitespace-nowrap">{pedido.cliente_nombre}</p>
                                <p className="text-xs text-on-surface-variant">
                                  #{pedido.id.toString().slice(-8)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant font-medium whitespace-nowrap">
                            {pedido.numero_transaccion ? `#${pedido.numero_transaccion}` : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-primary whitespace-nowrap">
                            ${Number(pedido.total).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                            {formatDate(pedido.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${getEstadoBadge(pedido.estado)}`}>
                              {pedido.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {pedido.comprobante_url ? (
                              <button
                                className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-surface-container-highest border border-outline-variant rounded text-xs text-primary hover:bg-primary hover:text-on-primary transition-all whitespace-nowrap mx-auto"
                                onClick={() => { setModalRecibo(pedido); setModalOpen(true); }}
                              >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                                Ver
                              </button>
                            ) : (
                              <span className="text-xs text-on-surface-variant italic whitespace-nowrap block text-center">Sin archivo</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              {pedido.estado !== 'Aprobado' && (
                                <button
                                  className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium hover:bg-green-500 hover:text-white transition-all active:scale-95"
                                  onClick={() => cambiarEstadoPedido(pedido.id, 'Aprobado')}
                                >
                                  Aprobar
                                </button>
                              )}
                              {pedido.estado !== 'Rechazado' && (
                                <button
                                  className="px-3 py-1.5 bg-error/20 text-error border border-error/30 rounded-lg text-xs font-medium hover:bg-error hover:text-on-error transition-all active:scale-95"
                                  onClick={() => cambiarEstadoPedido(pedido.id, 'Rechazado')}
                                >
                                  Rechazar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 text-on-surface-variant flex justify-between items-center bg-surface-container-lowest">
          <p className="text-xs">© 2024 THÖRGURT.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              System Online
            </span>
            <span className="text-xs">v2.4.0-Fresh</span>
          </div>
        </footer>
      </main>

      {/* Modal: Vista de comprobante */}
      {modalOpen && modalRecibo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-xl text-on-surface">Comprobante de Pago</h3>
                <p className="text-xs text-on-surface-variant mt-1">{modalRecibo.cliente_nombre}</p>
              </div>
              <button
                className="text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => setModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 bg-surface-container-lowest">
              {modalRecibo.comprobante_url ? (
                <img
                  src={modalRecibo.comprobante_url}
                  alt="Comprobante de pago"
                  className="w-full max-h-[60vh] object-contain rounded-lg border border-outline-variant"
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-surface-container-highest rounded-lg flex items-center justify-center border border-outline-variant">
                  <span className="material-symbols-outlined text-on-surface-variant text-6xl">receipt_long</span>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-between items-center gap-4">
              <div>
                <p className="text-sm text-on-surface font-medium">${Number(modalRecibo.total).toFixed(2)}</p>
                <p className="text-xs text-on-surface-variant">{formatDate(modalRecibo.created_at)}</p>
              </div>
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface border border-outline-variant rounded-lg transition-all"
                  onClick={() => setModalOpen(false)}
                >
                  Cerrar
                </button>
                <button
                  className="px-6 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium active:scale-95 transition-all"
                  onClick={() => {
                    cambiarEstadoPedido(modalRecibo.id, 'Aprobado');
                    setModalOpen(false);
                  }}
                >
                  Validar Ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Añadir Sabor */}
      {addFlavorModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
          onClick={() => setAddFlavorModalOpen(false)}
        >
          <div
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-semibold text-xl text-on-surface">Añadir Nuevo Sabor</h3>
              <button
                className="text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => setAddFlavorModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddFlavor} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Nombre del Sabor</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. Fresa"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                  value={newFlavor.sabor}
                  onChange={(e) => setNewFlavor({ ...newFlavor, sabor: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Presentación</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. Pequeño"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                  value={newFlavor.presentacion}
                  onChange={(e) => setNewFlavor({ ...newFlavor, presentacion: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-1">Precio ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2.50"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                    value={newFlavor.precio}
                    onChange={(e) => setNewFlavor({ ...newFlavor, precio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-1">Stock Inicial</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="100"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                    value={newFlavor.stock}
                    onChange={(e) => setNewFlavor({ ...newFlavor, stock: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  className="flex-1 py-3 text-sm font-medium text-on-surface-variant border border-outline-variant rounded-lg hover:text-on-surface hover:bg-surface-container-highest transition-all"
                  onClick={() => setAddFlavorModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingFlavor}
                  className="flex-1 py-3 bg-primary text-on-primary rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {savingFlavor ? (
                    <><span className="material-symbols-outlined animate-spin">sync</span> Guardando...</>
                  ) : (
                    'Guardar Sabor'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Añadir Presentación */}
      {addVariantModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
          onClick={() => setAddVariantModalOpen(false)}
        >
          <div
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-xl text-on-surface">Añadir Presentación</h3>
                <p className="text-xs text-on-surface-variant mt-1">Para el sabor: <strong className="text-primary">{selectedFlavorForVariant}</strong></p>
              </div>
              <button
                className="text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => setAddVariantModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddVariant} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Presentación</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. Grande"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                  value={newVariant.presentacion}
                  onChange={(e) => setNewVariant({ ...newVariant, presentacion: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-1">Precio ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5.00"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                    value={newVariant.precio}
                    onChange={(e) => setNewVariant({ ...newVariant, precio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-1">Stock Inicial</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="10"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                    value={newVariant.stock}
                    onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  className="flex-1 py-3 text-sm font-medium text-on-surface-variant border border-outline-variant rounded-lg hover:text-on-surface hover:bg-surface-container-highest transition-all"
                  onClick={() => setAddVariantModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingFlavor}
                  className="flex-1 py-3 bg-primary text-on-primary rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {savingFlavor ? (
                    <><span className="material-symbols-outlined animate-spin">sync</span> Guardando...</>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Sabor */}
      {editFlavorModalOpen && flavorToEdit && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
          onClick={() => setEditFlavorModalOpen(false)}
        >
          <div
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-semibold text-xl text-on-surface">Editar Sabor</h3>
              <button
                className="text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => setEditFlavorModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditFlavor} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Nombre del Sabor</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. Fresa"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                  value={flavorToEdit.sabor}
                  onChange={(e) => setFlavorToEdit({ ...flavorToEdit, sabor: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Presentación</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. Pequeño"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                  value={flavorToEdit.presentacion}
                  onChange={(e) => setFlavorToEdit({ ...flavorToEdit, presentacion: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-1">Precio ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2.50"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                    value={flavorToEdit.precio}
                    onChange={(e) => setFlavorToEdit({ ...flavorToEdit, precio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-1">Stock Actual</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="100"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                    value={flavorToEdit.stock}
                    onChange={(e) => setFlavorToEdit({ ...flavorToEdit, stock: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  className="flex-1 py-3 text-sm font-medium text-on-surface-variant border border-outline-variant rounded-lg hover:text-on-surface hover:bg-surface-container-highest transition-all"
                  onClick={() => setEditFlavorModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingFlavor}
                  className="flex-1 py-3 bg-primary text-on-primary rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {savingFlavor ? (
                    <><span className="material-symbols-outlined animate-spin">sync</span> Guardando...</>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
