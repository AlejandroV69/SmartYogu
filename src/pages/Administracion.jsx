import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Administracion() {
  const navigate = useNavigate();
  // ── UI state ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRecibo, setModalRecibo] = useState(null); // pedido seleccionado para ver recibo
  const [signedImageUrl, setSignedImageUrl] = useState(null); // URL firmada de la imagen
  const [addFlavorModalOpen, setAddFlavorModalOpen] = useState(false);
  const [editFlavorModalOpen, setEditFlavorModalOpen] = useState(false);
  const [addVariantModalOpen, setAddVariantModalOpen] = useState(false);
  const [selectedFlavorForVariant, setSelectedFlavorForVariant] = useState('');
  const [flavorToEdit, setFlavorToEdit] = useState(null);
  const [newFlavor, setNewFlavor] = useState({ sabor: '', presentacion: '', precio: '', stock: '' });
  const [newVariant, setNewVariant] = useState({ presentacion: '', precio: '', stock: '' });
  const [savingFlavor, setSavingFlavor] = useState(false);

  // ── Configuración de Pago Móvil (Almacenado localmente / Fallback) ──
  const [pagoMovilConfig, setPagoMovilConfig] = useState(() => {
    const saved = localStorage.getItem('smartyogu_pagomovil_config');
    return saved ? JSON.parse(saved) : {
      banco: 'Mercantil (0105)',
      cedula: 'V-29.863.496',
      telefono: '0414-315-6352'
    };
  });
  const [editPagoMovil, setEditPagoMovil] = useState({ ...pagoMovilConfig });
  const [savingConfig, setSavingConfig] = useState(false);

  // ── Datos ─────────────────────────────────────────────────────────
  const [inventario, setInventario] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [inventarioSedes, setInventarioSedes] = useState([]);
  const [selectedSedeTab, setSelectedSedeTab] = useState(null);
  const [loadingInv, setLoadingInv] = useState(true);
  const [loadingPed, setLoadingPed] = useState(true);
  const [loadingHist, setLoadingHist] = useState(true);
  const [loadingSedes, setLoadingSedes] = useState(true);
  const [error, setError] = useState(null);
  const [adminUser, setAdminUser] = useState({ name: 'Alejandro Viana', initials: 'AV' });
  const [addSedeModalOpen, setAddSedeModalOpen] = useState(false);
  const [addProductoSedeModalOpen, setAddProductoSedeModalOpen] = useState(false);
  const [editSedeModalOpen, setEditSedeModalOpen] = useState(false);
  const [sedeToEdit, setSedeToEdit] = useState(null);
  const [newSede, setNewSede] = useState({ nombre: '' });
  const [newProductoSede, setNewProductoSede] = useState({ producto_id: '', stock: '' });
  const [currentSedeForProduct, setCurrentSedeForProduct] = useState(null);

  // ── GET: user credentials & display name ──────────────────────────
  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User object:', user);
      if (user) {
        let name = user.user_metadata?.full_name || user.user_metadata?.name;
        const email = user.email ? user.email.toLowerCase() : '';
        
        if (email.includes('dorcary') || email.includes('gonzalez')) {
          name = 'Dorcary Gonzalez';
        } else if (email.includes('alejandro') || email.includes('viana')) {
          name = 'Alejandro Viana';
        }
        
        let avatarUrl = 
          user.user_metadata?.avatar_url || 
          user.user_metadata?.picture || 
          user.identities?.[0]?.identity_data?.avatar_url ||
          user.identities?.[0]?.identity_data?.picture ||
          null;
        
        if (!avatarUrl) {
          if (email.includes('dorcary') || email.includes('gonzalez')) {
            avatarUrl = '/admin-dorcary.jpg';
          } else if (email.includes('alejandro') || email.includes('viana')) {
            avatarUrl = '/admin-alejandro.jpg';
          }
        }
        
        if (!name) {
          const part = email.split('@')[0];
          name = part.split(/[\._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        
        const initials = name
          .split(' ')
          .map(n => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
          
        setAdminUser({ name, initials, avatarUrl });
      }
    }
    getUserData();
  }, []);

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

  // ── GET & REALTIME: pedidos e historial ──────────────────────────
  useEffect(() => {
    async function fetchPedidos() {
      setLoadingPed(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, cliente_nombre, cedula, telefono, tipo_entrega, direccion_envio, total, estado, comprobante_url, created_at, numero_transaccion, sede_id')
        .in('estado', ['Pago por Verificar', 'Pendiente por Pago'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando pedidos:', error.message);
      } else {
        setPedidos(data || []);
      }
      setLoadingPed(false);
    }

    async function fetchHistorial() {
      setLoadingHist(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, cliente_nombre, cedula, telefono, tipo_entrega, direccion_envio, total, estado, comprobante_url, created_at, numero_transaccion, sede_id')
        .in('estado', ['Aprobado', 'Rechazado'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando historial:', error.message);
      } else {
        setHistorial(data || []);
      }
      setLoadingHist(false);
    }

    fetchPedidos();
    fetchHistorial();

    // Suscripción Realtime para pedidos
    const channel = supabase
      .channel('pedidos-realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', scheme: 'public', table: 'pedidos' },
        (payload) => {
          console.log('Cambio detectado en tiempo real:', payload);
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === 'INSERT') {
            // Si es un pedido nuevo
            if (['Pago por Verificar', 'Pendiente por Pago'].includes(newRow.estado)) {
              setPedidos((prev) => [newRow, ...prev]);
            } else if (['Aprobado', 'Rechazado'].includes(newRow.estado)) {
              setHistorial((prev) => [newRow, ...prev]);
            }
          } else if (eventType === 'UPDATE') {
            // Actualizar la cola de verificación
            setPedidos((prev) => {
              const existeEnCola = prev.some((p) => p.id === newRow.id);
              if (['Pago por Verificar', 'Pendiente por Pago'].includes(newRow.estado)) {
                if (existeEnCola) {
                  return prev.map((p) => (p.id === newRow.id ? newRow : p));
                } else {
                  return [newRow, ...prev];
                }
              } else {
                return prev.filter((p) => p.id !== newRow.id);
              }
            });

            // Actualizar el historial
            setHistorial((prev) => {
              const existeEnHist = prev.some((h) => h.id === newRow.id);
              if (['Aprobado', 'Rechazado'].includes(newRow.estado)) {
                if (existeEnHist) {
                  return prev.map((h) => (h.id === newRow.id ? newRow : h));
                } else {
                  return [newRow, ...prev];
                }
              } else {
                return prev.filter((h) => h.id !== newRow.id);
              }
            });
          } else if (eventType === 'DELETE') {
            setPedidos((prev) => prev.filter((p) => p.id !== oldRow.id));
            setHistorial((prev) => prev.filter((h) => h.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── GET: sedes e inventario_sedes ─────────────────────────────────
  useEffect(() => {
    async function fetchSedes() {
      setLoadingSedes(true);
      const { data, error } = await supabase
        .from('sedes')
        .select('*')
        .order('nombre');
      if (!error && data) {
        setSedes(data);
        if (data.length > 0) setSelectedSedeTab(data[0].id);
      }
      setLoadingSedes(false);
    }
    async function fetchInventarioSedes() {
      const { data, error } = await supabase
        .from('inventario_sedes')
        .select('*, inventario(sabor, presentacion, precio)')
        .order('sede_id');
      if (!error && data) setInventarioSedes(data);
    }
    fetchSedes();
    fetchInventarioSedes();
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

  // ── UPDATE: cambiar estado de un pedido y descontar stock si es Aprobado ────────
  const cambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    const pedidoTarget = pedidos.find(p => p.id === pedidoId);
    
    // Actualización optimista
    setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p)));

    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoId);

    if (error) {
      console.error('Error actualizando pedido:', error.message);
      setError(`No se pudo actualizar el pedido: ${error.message}`);
    } else {
      // Si el pedido es Rechazado, DEVOLVEMOS el stock al inventario (porque ya se descontó al crearlo)
      if (nuevoEstado === 'Rechazado') {
        const { data: detalles } = await supabase
          .from('detalles_pedido')
          .select('producto_id, cantidad')
          .eq('pedido_id', pedidoId);

        if (detalles) {
          for (const det of detalles) {
            const { data: itemDb } = await supabase
              .from('inventario')
              .select('stock')
              .eq('id', det.producto_id)
              .single();

            if (itemDb) {
              const newStock = itemDb.stock + det.cantidad;
              await supabase.from('inventario').update({ stock: newStock }).eq('id', det.producto_id);
              setInventario(prev => prev.map(p => p.id === det.producto_id ? { ...p, stock: newStock } : p));
            }
          }
        }
      }

      // Quitar de la cola y mover al historial
      if ((nuevoEstado === 'Aprobado' || nuevoEstado === 'Rechazado') && pedidoTarget) {
        setTimeout(() => {
          setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
          setHistorial((prev) => [{ ...pedidoTarget, estado: nuevoEstado }, ...prev]);
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
        stock: 0,
      }])
      .select();

    if (error) {
      console.error('Error añadiendo presentación:', error.message);
      setError(`No se pudo añadir la presentación: ${error.message}`);
    } else if (data) {
      setInventario((prev) => [...prev, data[0]]);
      setAddVariantModalOpen(false);
      setNewVariant({ presentacion: '', precio: '' });
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
        stock: 0,
      }])
      .select();

    if (error) {
      console.error('Error añadiendo sabor:', error.message);
      setError(`No se pudo añadir el sabor: ${error.message}`);
    } else if (data) {
      // Actualización optimista
      setInventario((prev) => [...prev, data[0]].sort((a, b) => a.sabor.localeCompare(b.sabor)));
      setAddFlavorModalOpen(false);
      setNewFlavor({ sabor: '', presentacion: '', precio: '' });
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

  // ── DELETE: eliminar sabor/presentación ───────────────────────────
  const handleDeleteFlavor = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este sabor/presentación del inventario? Esta acción no se puede deshacer.')) return;
    
    const { error } = await supabase
      .from('inventario')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando sabor:', error.message);
      if (error.message.includes('foreign key constraint') || error.code === '23503') {
        setError('No puedes eliminar este sabor porque ya está vinculado a pedidos anteriores. Si ya no lo vendes, te sugiero poner su Stock en 0 y cambiarle el nombre a "Inactivo".');
      } else {
        setError(`No se pudo eliminar: ${error.message}`);
      }
    } else {
      setInventario((prev) => prev.filter(p => p.id !== id));
    }
  };

  // ── UPDATE/INSERT: stock de inventario_sedes (upsert) ───────────────
  const updateStockSede = async (sedeId, productoId, delta) => {
    const existing = inventarioSedes.find(i => i.sede_id === sedeId && i.producto_id === productoId);
    const currentStock = existing?.stock ?? 0;
    const nuevoStock = Math.max(0, currentStock + delta);

    if (existing) {
      // Actualización optimista
      setInventarioSedes(prev => prev.map(i =>
        i.id === existing.id ? { ...i, stock: nuevoStock } : i
      ));
      const { error } = await supabase
        .from('inventario_sedes')
        .update({ stock: nuevoStock })
        .eq('id', existing.id);
      if (error) {
        setInventarioSedes(prev => prev.map(i => i.id === existing.id ? { ...i, stock: currentStock } : i));
        setError(`Error al actualizar stock: ${error.message}`);
      }
    } else if (nuevoStock > 0) {
      // Crear nueva fila (primera vez que se añade stock a esta sede)
      const { data, error } = await supabase
        .from('inventario_sedes')
        .insert([{ sede_id: sedeId, producto_id: productoId, stock: nuevoStock }])
        .select('*, inventario(sabor, presentacion, precio)');
      if (error) {
        setError(`Error al crear stock en sede: ${error.message}`);
      } else if (data) {
        setInventarioSedes(prev => [...prev, data[0]]);
      }
    }
  };

  // ── POST: agregar producto a una sede ─────────────────────────────
  const handleAddProductoSede = async (e) => {
    e.preventDefault();
    setSavingFlavor(true);
    const { data, error } = await supabase
      .from('inventario_sedes')
      .insert([{
        sede_id: currentSedeForProduct,
        producto_id: parseInt(newProductoSede.producto_id, 10),
        stock: parseInt(newProductoSede.stock, 10),
      }])
      .select('*, inventario(sabor, presentacion, precio)');
    if (error) {
      console.error('Error agregando producto a sede:', error.message);
      setError(`No se pudo agregar el producto: ${error.message}`);
    } else if (data) {
      setInventarioSedes(prev => [...prev, data[0]]);
      setAddProductoSedeModalOpen(false);
      setNewProductoSede({ producto_id: '', stock: '' });
    }
    setSavingFlavor(false);
  };

  // ── POST: crear nueva sede ────────────────────────────────────────
  const handleAddSede = async (e) => {
    e.preventDefault();
    setSavingFlavor(true);
    const { data, error } = await supabase
      .from('sedes')
      .insert([{ nombre: newSede.nombre, activa: true }])
      .select();
    if (error) {
      console.error('Error creando sede:', error.message);
      setError(`No se pudo crear la sede: ${error.message}`);
    } else if (data) {
      setSedes(prev => [...prev, data[0]].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setSelectedSedeTab(data[0].id);
      setAddSedeModalOpen(false);
      setNewSede({ nombre: '' });
    }
    setSavingFlavor(false);
  };

  // ── UPDATE: activar/desactivar sede ──────────────────────────────
  const handleToggleSede = async (id, activa) => {
    const { error } = await supabase
      .from('sedes')
      .update({ activa: !activa })
      .eq('id', id);
    if (!error) {
      setSedes(prev => prev.map(s => s.id === id ? { ...s, activa: !activa } : s));
    }
  };

  // ── UPDATE: renombrar sede ──────────────────────────────────
  const handleEditSede = async (e) => {
    e.preventDefault();
    if (!sedeToEdit) return;
    setSavingFlavor(true);
    const { error } = await supabase
      .from('sedes')
      .update({ nombre: sedeToEdit.nombre })
      .eq('id', sedeToEdit.id);
    if (error) {
      setError(`Error al renombrar sede: ${error.message}`);
    } else {
      setSedes(prev => prev.map(s => s.id === sedeToEdit.id ? { ...s, nombre: sedeToEdit.nombre } : s));
      setEditSedeModalOpen(false);
      setSedeToEdit(null);
    }
    setSavingFlavor(false);
  };

  // ── DELETE: eliminar sede ──────────────────────────────────
  const handleDeleteSede = async (sedeId, sedeNombre) => {
    if (!window.confirm(`¿Seguro que quieres eliminar la sede "${sedeNombre}"? Esto también borrará todo su inventario asignado.`)) return;
    const { error } = await supabase
      .from('sedes')
      .delete()
      .eq('id', sedeId);
    if (error) {
      setError(`Error al eliminar sede: ${error.message}`);
    } else {
      setSedes(prev => prev.filter(s => s.id !== sedeId));
      setInventarioSedes(prev => prev.filter(i => i.sede_id !== sedeId));
      if (selectedSedeTab === sedeId) setSelectedSedeTab(null);
    }
  };

  const getInventarioAgrupado = () => {
    const term = searchQuery.toLowerCase().trim();
    const filtered = term ? inventario.filter(item => 
      item.sabor.toLowerCase().includes(term) || 
      item.presentacion.toLowerCase().includes(term)
    ) : inventario;

    const agrupado = filtered.reduce((acc, item) => {
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

  const getPedidosFiltrados = (lista) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return lista;
    return lista.filter(p => 
      p.cliente_nombre?.toLowerCase().includes(term) ||
      p.cedula?.toLowerCase().includes(term) ||
      p.tipo_entrega?.toLowerCase().includes(term) ||
      p.numero_transaccion?.toLowerCase().includes(term) ||
      p.estado?.toLowerCase().includes(term)
    );
  };

  const getSedeName = (sedeId) => sedes.find(s => s.id === sedeId)?.nombre || '—';

  // Calcula el stock TOTAL de un producto sumando todas sus sedes
  const getStockTotal = (productoId) =>
    inventarioSedes
      .filter(i => i.producto_id === productoId)
      .reduce((sum, i) => sum + i.stock, 0);

  // Retorna el stock desglosado por sede para un producto
  const getStockPorSede = (productoId) =>
    inventarioSedes
      .filter(i => i.producto_id === productoId)
      .map(i => ({ nombre: getSedeName(i.sede_id), stock: i.stock }));

  const handleOpenRecibo = async (pedido) => {
    setModalRecibo(pedido);
    setSignedImageUrl(null);
    setModalOpen(true);
    
    if (pedido.comprobante_url) {
      // Extract file path from full URL or use as is if it's just the file name
      let filePath = pedido.comprobante_url;
      if (filePath.includes('/storage/v1/object/public/comprobantes/')) {
        filePath = filePath.split('/storage/v1/object/public/comprobantes/')[1];
      }
      
      const { data, error } = await supabase.storage.from('comprobantes').createSignedUrl(filePath, 60 * 60); // 1 hour valid
      if (!error && data) {
        setSignedImageUrl(data.signedUrl);
      } else {
        // Fallback to original URL
        setSignedImageUrl(pedido.comprobante_url);
      }
    }
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
            { icon: 'history', label: 'Historial', id: 'History' },
            { icon: 'store', label: 'Sedes', id: 'Sedes' },
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
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold overflow-hidden">
                {adminUser.avatarUrl ? (
                  <img src={adminUser.avatarUrl} alt={adminUser.name} className="w-full h-full object-cover" />
                ) : (
                  adminUser.initials
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">{adminUser.name}</p>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center cursor-pointer hover:scale-105 transition-transform overflow-hidden">
              {adminUser.avatarUrl ? (
                <img src={adminUser.avatarUrl} alt={adminUser.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-primary text-xl">account_circle</span>
              )}
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

          {/* Dashboard KPIs Section */}
          {activeTab === 'Dashboard' && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI: Ventas de Hoy */}
              <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start text-on-surface-variant">
                    <span className="text-xs uppercase font-bold tracking-wider">Ventas de Hoy</span>
                    <span className="material-symbols-outlined text-primary">calendar_today</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-on-surface mt-2 tracking-tight">
                    ${(() => {
                      const hoy = new Date().toISOString().split('T')[0];
                      const totalHoy = historial
                        .filter(p => p.estado === 'Aprobado' && p.created_at.startsWith(hoy))
                        .reduce((sum, p) => sum + Number(p.total), 0);
                      return totalHoy.toFixed(2);
                    })()}
                  </h3>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-3">
                  Solo pedidos con estado <span className="text-green-400 font-bold">Aprobado</span>
                </p>
              </div>

              {/* KPI: Pedidos Pendientes */}
              <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start text-on-surface-variant">
                    <span className="text-xs uppercase font-bold tracking-wider">Por Verificar</span>
                    <span className="material-symbols-outlined text-tertiary">pending_actions</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-on-surface mt-2 tracking-tight">
                    {pedidos.filter(p => p.estado === 'Pago por Verificar').length}
                  </h3>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-3">
                  Pagos pendientes de aprobación manual
                </p>
              </div>

              {/* KPI: Total Recaudado */}
              <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start text-on-surface-variant">
                    <span className="text-xs uppercase font-bold tracking-wider">Total Histórico</span>
                    <span className="material-symbols-outlined text-green-500">payments</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-on-surface mt-2 tracking-tight">
                    ${historial
                      .filter(p => p.estado === 'Aprobado')
                      .reduce((sum, p) => sum + Number(p.total), 0)
                      .toFixed(2)}
                  </h3>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-3">
                  Acumulado histórico aprobado
                </p>
              </div>

              {/* KPI: Stock Total Global */}
              <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start text-on-surface-variant">
                    <span className="text-xs uppercase font-bold tracking-wider">Stock Total Global</span>
                    <span className="material-symbols-outlined text-primary">inventory_2</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-on-surface mt-2 tracking-tight">
                    {inventarioSedes.reduce((sum, i) => sum + (i.stock || 0), 0)}
                  </h3>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-3">
                  Suma total de unidades en todas las sedes
                </p>
              </div>
            </section>
          )}

          {/* KPIs por Sede */}
          {activeTab === 'Dashboard' && sedes.length > 0 && (
            <section>
              <h3 className="font-semibold text-base text-on-surface-variant uppercase tracking-wider mb-3">Stock por Sede</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sedes.map(sede => {
                  const totalUnidadesSede = inventarioSedes
                    .filter(i => i.sede_id === sede.id)
                    .reduce((sum, i) => sum + i.stock, 0);
                  const productosBajos = inventario.filter(p => {
                    const s = inventarioSedes.find(i => i.sede_id === sede.id && i.producto_id === p.id)?.stock ?? 0;
                    return s > 0 && s <= 10;
                  }).length;
                  const productosCargados = inventarioSedes.filter(i => i.sede_id === sede.id && i.stock > 0).length;
                  return (
                    <div
                      key={sede.id}
                      className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col gap-3 cursor-pointer hover:border-primary/40 hover:bg-surface-container-high transition-all"
                      onClick={() => { setSelectedSedeTab(sede.id); setActiveTab('Sedes'); }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-primary text-[18px]">store</span>
                          </div>
                          <div>
                            <p className="font-bold text-on-surface text-sm">{sede.nombre}</p>
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              sede.activa ? 'bg-green-500/15 text-green-400' : 'bg-error/15 text-error'
                            }`}>{sede.activa ? 'Activa' : 'Inactiva'}</span>
                          </div>
                        </div>
                        {productosBajos > 0 && (
                          <span className="text-[10px] bg-error/10 text-error border border-error/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            {productosBajos} bajo
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold">Stock Total</p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-extrabold text-on-surface tabular-nums">{totalUnidadesSede}</span>
                            <span className="text-xs text-on-surface-variant font-medium">unidades</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold">Variantes</p>
                          <p className="text-sm font-bold text-on-surface tabular-nums">
                            {productosCargados} <span className="text-xs text-on-surface-variant font-normal">de {inventario.length}</span>
                          </p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: inventario.length > 0 ? `${Math.min(100, (productosCargados / inventario.length) * 100)}%` : '0%' }}
                        />
                      </div>
                      <p className="text-[10px] text-on-surface-variant flex items-center justify-between">
                        <span>Gestionar inventario</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Hero */}
          <section className="relative h-28 rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant flex items-center px-6">
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-transparent to-transparent"></div>
            <div className="relative z-10">
              <p className="text-primary font-bold text-xs uppercase tracking-tighter mb-0.5">Gestión Administrativa</p>
              <h1 className="font-extrabold text-2xl md:text-3xl text-on-surface leading-none">
                {activeTab === 'Dashboard' ? 'Panel General' : activeTab === 'Inventory' ? 'Inventario de Sabores' : activeTab === 'Verification' ? 'Cola de Verificación' : activeTab === 'History' ? 'Historial de Pedidos' : activeTab === 'Sedes' ? 'Inventario por Sedes' : 'Configuración'}
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
                <div className="flex gap-2">
                  <button
                    className="bg-surface-container-highest border border-outline-variant text-on-surface hover:bg-primary/10 hover:text-primary hover:border-primary/30 px-3 md:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 active:scale-95 transition-all shadow"
                    onClick={() => {
                      const getSaborEmoji = (sabor) => {
                        const s = sabor.toLowerCase();
                        if (s.includes('fresa')) return '🍓';
                        if (s.includes('melocotón') || s.includes('melocoton') || s.includes('durazno')) return '🍑';
                        if (s.includes('parchita') || s.includes('maracuyá') || s.includes('maracuya')) return '🟡';
                        if (s.includes('piña') || s.includes('pina')) return '🍍';
                        if (s.includes('mora') || s.includes('arándano')) return '🫐';
                        if (s.includes('coco')) return '🥥';
                        if (s.includes('mango')) return '🥭';
                        return '🍦';
                      };

                      let texto = `🥣 *Disponibilidad THÖRGURT* 🥣\n- - - - - - - - - - - - -\n\n`;
                      const productosAgrupados = getInventarioAgrupado();
                      let hayDisponibles = false;

                      productosAgrupados.forEach(grupo => {
                        const variantesDisponibles = grupo.variantes.filter(item => getStockTotal(item.id) > 0);
                        
                        if (variantesDisponibles.length > 0) {
                          hayDisponibles = true;
                          const emoji = getSaborEmoji(grupo.sabor);
                          texto += `${emoji} *${grupo.sabor}*\n`;
                          variantesDisponibles.forEach(v => {
                            texto += `    • ${v.presentacion} → $${Number(v.precio).toFixed(2)}\n`;
                          });
                          texto += `\n`;
                        }
                      });

                      if (!hayDisponibles) {
                        texto += `Actualmente no hay productos disponibles.\n\n`;
                      }

                      texto += `- - - - - - - - - - - - -\n📦 Hacemos delivery\n📲 ¡Escríbenos para hacer tu pedido!\n\n🌐 Registra tu compra aquí:\nhttps://smart-yogu.vercel.app/`;

                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(texto);
                        alert('¡Lista de disponibilidad global copiada al portapapeles!');
                      } else {
                        const ta = document.createElement('textarea');
                        ta.value = texto;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                        alert('¡Lista de disponibilidad copiada!');
                      }
                    }}
                    title="Copiar lista global de productos disponibles"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                    <span className="hidden md:inline">Compartir Disponibilidad</span>
                  </button>
                  <button
                    className="bg-primary text-on-primary px-4 md:px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 active:scale-95 transition-all shadow-lg hover:brightness-110"
                    onClick={() => setAddFlavorModalOpen(true)}
                  >
                    <span className="material-symbols-outlined">add</span>
                    <span className="hidden md:inline">Añadir Sabor</span>
                  </button>
                </div>
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
                              <div className="flex gap-1">
                                <button 
                                  className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded hover:bg-primary/10"
                                  onClick={() => { setFlavorToEdit(item); setEditFlavorModalOpen(true); }}
                                  title="Editar"
                                >
                                  <span className="material-symbols-outlined text-sm block">edit</span>
                                </button>
                                <button 
                                  className="text-on-surface-variant hover:text-error transition-colors p-1 rounded hover:bg-error/10"
                                  onClick={() => handleDeleteFlavor(item.id)}
                                  title="Eliminar"
                                >
                                  <span className="material-symbols-outlined text-sm block">delete</span>
                                </button>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">Stock Total</p>
                                  <div className="text-3xl font-extrabold text-on-surface leading-none tabular-nums tracking-tighter">
                                    {getStockTotal(item.id)}
                                  </div>
                                </div>
                                <button
                                  onClick={() => setActiveTab('Sedes')}
                                  className="text-[10px] font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                                  title="Gestionar stock por sede"
                                >
                                  <span className="material-symbols-outlined text-[14px]">store</span>
                                  Sedes
                                </button>
                              </div>
                              {/* Desglose por sede */}
                              <div className="flex flex-wrap gap-1">
                                {getStockPorSede(item.id).length === 0 ? (
                                  <span className="text-[9px] text-on-surface-variant italic">Sin asignar a sedes</span>
                                ) : (
                                  getStockPorSede(item.id).map((s, idx) => (
                                    <span key={idx} className="text-[9px] bg-surface-container-highest px-1.5 py-0.5 rounded text-on-surface-variant font-medium">
                                      {s.nombre}: {s.stock}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>

                            <div className="flex justify-between items-center gap-3">
                              <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${getStockColor(getStockTotal(item.id))}`}
                                  style={{ width: getStockWidth(getStockTotal(item.id)) }}
                                />
                              </div>
                              <span className={`text-[10px] font-bold ${getStockTotal(item.id) <= 10 ? 'text-error' : getStockTotal(item.id) <= 30 ? 'text-tertiary' : 'text-primary'}`}>
                                {getStockTotal(item.id) <= 10 ? 'BAJO' : getStockTotal(item.id) <= 30 ? 'MEDIO' : 'OK'}
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
                      {getPedidosFiltrados(pedidos).map((pedido) => (
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
                                <p className="text-sm font-medium text-on-surface whitespace-nowrap">
                                  {pedido.cliente_nombre}
                                  <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded ml-2">#{pedido.id}</span>
                                </p>
                                <p className="text-xs text-on-surface-variant">
                                  {pedido.cedula} | {pedido.telefono}
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
                                onClick={() => handleOpenRecibo(pedido)}
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

          {/* ── Sección 3: Historial de Pedidos ────────────────────────── */}
          {(activeTab === 'Dashboard' || activeTab === 'History') && (
            <section id="history">
              <div className="mb-6 mt-12">
                <h3 className="font-semibold text-xl md:text-2xl text-on-surface">Historial de Pedidos</h3>
                <p className="text-on-surface-variant text-sm font-medium">
                  Registro de todos los pedidos aprobados y rechazados
                </p>
              </div>

              {loadingHist ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 bg-surface-container rounded-xl animate-pulse border border-outline-variant" />
                  ))}
                </div>
              ) : historial.length === 0 ? (
                <div className="text-center py-12 bg-surface-container rounded-xl border border-outline-variant">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant block mb-3">history</span>
                  <p className="text-on-surface-variant text-sm">No hay registros en el historial.</p>
                </div>
              ) : (
                <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-surface-container-high border-b border-outline-variant">
                        {['Cliente', 'Ref.', 'Monto', 'Fecha / Hora', 'Estado', 'Comprobante'].map((h) => (
                          <th key={h} className={`px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap ${h === 'Comprobante' ? 'text-center' : 'text-left'}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {getPedidosFiltrados(historial).map((pedido) => (
                        <tr
                          key={pedido.id}
                          className="hover:bg-surface-container-highest transition-colors group opacity-80"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                                {pedido.cliente_nombre?.slice(0, 2).toUpperCase() || '??'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-on-surface whitespace-nowrap">
                                  {pedido.cliente_nombre}
                                  <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded ml-2">#{pedido.id}</span>
                                </p>
                                <p className="text-xs text-on-surface-variant">
                                  {pedido.cedula} | {pedido.telefono}
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
                                onClick={() => handleOpenRecibo(pedido)}
                              >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                                Ver
                              </button>
                            ) : (
                              <span className="text-xs text-on-surface-variant italic whitespace-nowrap block text-center">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ── Sección 5: Sedes ──────────────────────────────────────────── */}
          {activeTab === 'Sedes' && (
            <section id="sedes">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="font-semibold text-xl md:text-2xl text-on-surface">Inventario por Sedes</h3>
                  <p className="text-on-surface-variant text-sm font-medium">Stock independiente por punto de venta</p>
                </div>
                <div className="flex gap-2">
                  {selectedSedeTab && (
                    <button
                      className="bg-surface-container-highest border border-outline-variant text-on-surface hover:bg-primary/10 hover:text-primary hover:border-primary/30 px-3 md:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 active:scale-95 transition-all shadow"
                      onClick={() => {
                        const sedeActual = sedes.find(s => s.id === selectedSedeTab);
                        
                        const getSaborEmoji = (sabor) => {
                          const s = sabor.toLowerCase();
                          if (s.includes('fresa')) return '🍓';
                          if (s.includes('melocotón') || s.includes('melocoton') || s.includes('durazno')) return '🍑';
                          if (s.includes('parchita') || s.includes('maracuyá') || s.includes('maracuya')) return '🟡';
                          if (s.includes('piña') || s.includes('pina')) return '🍍';
                          if (s.includes('mora') || s.includes('arándano')) return '🫐';
                          if (s.includes('coco')) return '🥥';
                          if (s.includes('mango')) return '🥭';
                          return '🍦';
                        };

                        let texto = `🥣 *Disponibilidad THÖRGURT* 🥣\n📍 *Sede:* ${sedeActual?.nombre || 'General'}\n- - - - - - - - - - - - -\n\n`;
                        
                        const productosAgrupados = getInventarioAgrupado();
                        let hayDisponibles = false;
                        
                        productosAgrupados.forEach(grupo => {
                          const variantesDisponibles = grupo.variantes.filter(item => {
                            const st = inventarioSedes.find(i => i.sede_id === selectedSedeTab && i.producto_id === item.id)?.stock ?? 0;
                            return st > 0;
                          });
                          
                          if (variantesDisponibles.length > 0) {
                            hayDisponibles = true;
                            const emoji = getSaborEmoji(grupo.sabor);
                            texto += `${emoji} *${grupo.sabor}*\n`;
                            variantesDisponibles.forEach(v => {
                              texto += `    • ${v.presentacion} → $${Number(v.precio).toFixed(2)}\n`;
                            });
                            texto += `\n`;
                          }
                        });
                        
                        if (!hayDisponibles) {
                          texto += `Actualmente no hay productos disponibles en esta sede.\n\n`;
                        }
                        
                        texto += `- - - - - - - - - - - - -\n📦 Hacemos delivery\n📲 ¡Escríbenos para hacer tu pedido!\n\n🌐 Registra tu compra aquí:\nhttps://smart-yogu.vercel.app/`;

                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(texto);
                          alert('¡Lista de disponibilidad copiada al portapapeles! Puedes pegarla en WhatsApp.');
                        } else {
                          const ta = document.createElement('textarea');
                          ta.value = texto;
                          document.body.appendChild(ta);
                          ta.select();
                          document.execCommand('copy');
                          document.body.removeChild(ta);
                          alert('¡Lista de disponibilidad copiada al portapapeles!');
                        }
                      }}
                      title="Copiar lista de productos disponibles en esta sede"
                    >
                      <span className="material-symbols-outlined text-[18px]">share</span>
                      <span className="hidden md:inline">Compartir Disponibilidad</span>
                    </button>
                  )}
                  <button
                    className="bg-primary text-on-primary px-4 md:px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 active:scale-95 transition-all shadow-lg hover:brightness-110"
                    onClick={() => setAddSedeModalOpen(true)}
                  >
                    <span className="material-symbols-outlined">add</span>
                    <span className="hidden md:inline">Nueva Sede</span>
                  </button>
                </div>
              </div>

              {loadingSedes ? (
                <div className="space-y-3">
                  {[1, 2].map(n => <div key={n} className="h-12 bg-surface-container rounded-xl animate-pulse border border-outline-variant" />)}
                </div>
              ) : sedes.length === 0 ? (
                <div className="text-center py-16 bg-surface-container rounded-xl border border-outline-variant">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant block mb-3">store</span>
                  <p className="text-on-surface-variant text-sm font-medium">No hay sedes registradas.</p>
                  <p className="text-on-surface-variant text-xs mt-1">Crea la primera sede con el botón de arriba.</p>
                </div>
              ) : (
                <>
                  {/* Tabs de Sedes */}
                  <div className="flex gap-2 flex-wrap mb-6 p-1.5 bg-surface-container rounded-xl border border-outline-variant">
                    {sedes.map(sede => (
                      <button
                        key={sede.id}
                        onClick={() => setSelectedSedeTab(sede.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedSedeTab === sede.id
                            ? 'bg-primary text-on-primary shadow-md scale-[1.02]'
                            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">store</span>
                        {sede.nombre}
                        {!sede.activa && (
                          <span className="text-[9px] uppercase bg-error/20 text-error px-1 py-0.5 rounded font-bold">Inactiva</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Contenido de la sede seleccionada */}
                  {selectedSedeTab && (() => {
                    const sedeActual = sedes.find(s => s.id === selectedSedeTab);
                    // Total unidades = suma de todo el stock de esta sede
                    const totalUnidades = inventarioSedes
                      .filter(i => i.sede_id === selectedSedeTab)
                      .reduce((sum, i) => sum + i.stock, 0);
                    // Productos con stock bajo = productos del catálogo con stock entre 1 y 10 en esta sede
                    const bajosEnStock = inventario.filter(p => {
                      const s = inventarioSedes.find(i => i.sede_id === selectedSedeTab && i.producto_id === p.id)?.stock ?? 0;
                      return s > 0 && s <= 10;
                    }).length;

                    return (
                      <div className="space-y-4">
                        {/* Info bar de la sede */}
                        <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-surface-container border border-outline-variant rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-primary">store</span>
                            </div>
                            <div>
                              <p className="font-bold text-on-surface">{sedeActual?.nombre}</p>
                              <p className="text-xs text-on-surface-variant">
                                {inventario.length} productos · {totalUnidades} unidades en sede
                                {bajosEnStock > 0 && <span className="text-error ml-2">· ⚠ {bajosEnStock} bajo stock</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleSede(sedeActual.id, sedeActual.activa)}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all active:scale-95 ${
                                sedeActual?.activa
                                  ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                                  : 'bg-error/10 text-error border-error/30 hover:bg-error/20'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px] align-middle mr-1">
                                {sedeActual?.activa ? 'toggle_on' : 'toggle_off'}
                              </span>
                              {sedeActual?.activa ? 'Activa' : 'Inactiva'}
                            </button>
                            <button
                              onClick={() => { setSedeToEdit({ ...sedeActual }); setEditSedeModalOpen(true); }}
                              className="text-xs px-3 py-1.5 rounded-lg border border-outline-variant font-bold bg-surface-container-highest hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all active:scale-95 flex items-center gap-1"
                              title="Renombrar sede"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              <span className="hidden md:inline">Renombrar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteSede(sedeActual.id, sedeActual.nombre)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-error/30 font-bold bg-error/10 text-error hover:bg-error/20 transition-all active:scale-95 flex items-center gap-1"
                              title="Eliminar sede"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                              <span className="hidden md:inline">Eliminar</span>
                            </button>
                          </div>
                        </div>


                        {/* Grid: TODOS los productos del catálogo por sabor */}
                        {loadingInv ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[1,2,3,4].map(n => <div key={n} className="h-48 bg-surface-container rounded-xl animate-pulse border border-outline-variant" />)}
                          </div>
                        ) : inventario.length === 0 ? (
                          <div className="text-center py-12 bg-surface-container rounded-xl border border-dashed border-outline-variant">
                            <span className="material-symbols-outlined text-4xl text-on-surface-variant block mb-2">inventory_2</span>
                            <p className="text-on-surface-variant text-sm font-medium">No hay productos en el catálogo.</p>
                            <p className="text-xs text-on-surface-variant mt-1">Añade sabores desde el tab Inventario primero.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {getInventarioAgrupado().map(grupo => (
                              <div
                                key={grupo.sabor}
                                className="bento-card bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-4"
                              >
                                <h4 className="font-semibold text-lg text-primary">{grupo.sabor}</h4>
                                <div className="flex flex-col gap-3">
                                  {grupo.variantes.map(item => {
                                    const stockSede = inventarioSedes.find(
                                      i => i.sede_id === selectedSedeTab && i.producto_id === item.id
                                    )?.stock ?? 0;
                                    return (
                                      <div key={item.id} className="bg-surface-container-low border border-outline-variant rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-2">
                                          <div>
                                            <span className="text-sm font-bold text-on-surface">{item.presentacion}</span>
                                            <span className="text-xs text-on-surface-variant ml-2">${Number(item.precio).toFixed(2)}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-3">
                                          <div className="flex-1">
                                            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Stock Sede</p>
                                            <div className="text-3xl font-extrabold text-on-surface leading-none tabular-nums tracking-tighter">
                                              {stockSede}
                                            </div>
                                          </div>
                                          <div className="flex gap-1">
                                            <button
                                              className="w-8 h-8 flex items-center justify-center bg-surface-container-highest rounded-lg text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-90 border border-outline-variant"
                                              onClick={() => updateStockSede(selectedSedeTab, item.id, 1)}
                                            >
                                              <span className="material-symbols-outlined text-sm">add</span>
                                            </button>
                                            <button
                                              className="w-8 h-8 flex items-center justify-center bg-surface-container-highest rounded-lg text-primary hover:bg-error hover:text-on-error transition-all active:scale-90 border border-outline-variant disabled:opacity-40"
                                              onClick={() => updateStockSede(selectedSedeTab, item.id, -1)}
                                              disabled={stockSede === 0}
                                            >
                                              <span className="material-symbols-outlined text-sm">remove</span>
                                            </button>
                                          </div>
                                        </div>
                                        <div className="flex justify-between items-center gap-3">
                                          <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                            <div
                                              className={`h-full transition-all duration-500 ${getStockColor(stockSede)}`}
                                              style={{ width: getStockWidth(stockSede) }}
                                            />
                                          </div>
                                          <span className={`text-[10px] font-bold ${stockSede <= 10 ? 'text-error' : stockSede <= 30 ? 'text-tertiary' : 'text-primary'}`}>
                                            {stockSede <= 10 ? 'BAJO' : stockSede <= 30 ? 'MEDIO' : 'OK'}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </section>
          )}

          {/* ── Sección 4: Configuración ────────────────────────────────────────── */}
          {activeTab === 'Settings' && (
            <section id="settings" className="max-w-2xl bg-surface-container border border-outline-variant rounded-xl p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-xl text-on-surface">Datos de Pago Móvil</h3>
                <p className="text-on-surface-variant text-sm font-medium">
                  Configura los datos que ven los clientes al reportar su pago
                </p>
              </div>

               <form 
                 onSubmit={(e) => {
                   e.preventDefault();
                   setSavingConfig(true);
                   localStorage.setItem('smartyogu_pagomovil_config', JSON.stringify(editPagoMovil));
                   setPagoMovilConfig({ ...editPagoMovil });
                   
                   // Notificar a otras pestañas/ventanas del cambio
                   window.dispatchEvent(new Event('storage'));
                   
                   setTimeout(() => {
                     setSavingConfig(false);
                     alert('Configuración guardada exitosamente.');
                   }, 500);
                 }}
                 className="space-y-4"
               >
                 <div>
                   <label className="text-sm font-medium text-on-surface-variant block mb-1">Banco</label>
                   <input
                     required
                     type="text"
                     className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                     value={editPagoMovil.banco}
                     onChange={(e) => setEditPagoMovil({ ...editPagoMovil, banco: e.target.value })}
                   />
                 </div>
                 <div>
                   <label className="text-sm font-medium text-on-surface-variant block mb-1">Cédula / RIF</label>
                   <input
                     required
                     type="text"
                     className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                     value={editPagoMovil.cedula}
                     onChange={(e) => setEditPagoMovil({ ...editPagoMovil, cedula: e.target.value })}
                   />
                 </div>
                 <div>
                   <label className="text-sm font-medium text-on-surface-variant block mb-1">Teléfono</label>
                   <input
                     required
                     type="text"
                     className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                     value={editPagoMovil.telefono}
                     onChange={(e) => setEditPagoMovil({ ...editPagoMovil, telefono: e.target.value })}
                   />
                 </div>
                 
                 <div className="pt-2">
                   <button
                     type="submit"
                     disabled={savingConfig}
                     className="px-6 py-3 bg-primary text-on-primary rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer active:scale-95"
                   >
                     {savingConfig ? (
                       <><span className="material-symbols-outlined animate-spin">sync</span> Guardando...</>
                     ) : (
                       'Guardar Configuración'
                     )}
                   </button>
                 </div>
               </form>
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
                  src={signedImageUrl || modalRecibo.comprobante_url}
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
              <div className="flex gap-2">
                <button
                  className="px-3 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface border border-outline-variant rounded-lg transition-all"
                  onClick={() => setModalOpen(false)}
                >
                  Cerrar
                </button>
                {modalRecibo.estado !== 'Rechazado' && modalRecibo.estado !== 'Aprobado' && (
                  <button
                    className="px-3 py-2 bg-error/20 text-error border border-error/30 rounded-lg text-sm font-medium hover:bg-error hover:text-on-error transition-all active:scale-95"
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que deseas rechazar este pago?')) {
                        cambiarEstadoPedido(modalRecibo.id, 'Rechazado');
                        setModalOpen(false);
                      }
                    }}
                  >
                    Rechazar
                  </button>
                )}
                {modalRecibo.estado !== 'Aprobado' && (
                  <button
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium active:scale-95 transition-all"
                    onClick={() => {
                      cambiarEstadoPedido(modalRecibo.id, 'Aprobado');
                      setModalOpen(false);
                    }}
                  >
                    Aprobar Pago
                  </button>
                )}
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
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Tamaño (Oz)</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. 7 oz"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                  value={newFlavor.presentacion}
                  onChange={(e) => setNewFlavor({ ...newFlavor, presentacion: e.target.value })}
                />
              </div>
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
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Tamaño (Oz)</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. 12 oz"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                  value={newVariant.presentacion}
                  onChange={(e) => setNewVariant({ ...newVariant, presentacion: e.target.value })}
                />
              </div>
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

      {/* Modal: Crear Nueva Sede */}
      {addSedeModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
          onClick={() => setAddSedeModalOpen(false)}
        >
          <div
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-xl text-on-surface">Nueva Sede</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Añade un nuevo punto de venta</p>
              </div>
              <button className="text-on-surface-variant hover:text-primary transition-colors" onClick={() => setAddSedeModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddSede} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Nombre de la Sede</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. Sede Centro"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                  value={newSede.nombre}
                  onChange={e => setNewSede({ nombre: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="flex-1 py-3 text-sm font-medium text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-highest transition-all" onClick={() => setAddSedeModalOpen(false)}>Cancelar</button>
                <button type="submit" disabled={savingFlavor} className="flex-1 py-3 bg-primary text-on-primary rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                  {savingFlavor ? <><span className="material-symbols-outlined animate-spin">sync</span> Guardando...</> : 'Crear Sede'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agregar Producto a Sede */}
      {addProductoSedeModalOpen && currentSedeForProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
          onClick={() => setAddProductoSedeModalOpen(false)}
        >
          <div
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-xl text-on-surface">Agregar Producto</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Para: <strong className="text-primary">{sedes.find(s => s.id === currentSedeForProduct)?.nombre}</strong></p>
              </div>
              <button className="text-on-surface-variant hover:text-primary transition-colors" onClick={() => setAddProductoSedeModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddProductoSede} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Producto</label>
                <select
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                  value={newProductoSede.producto_id}
                  onChange={e => setNewProductoSede({ ...newProductoSede, producto_id: e.target.value })}
                >
                  <option value="">Selecciona un producto...</option>
                  {inventario
                    .filter(p => !inventarioSedes.some(is => is.sede_id === currentSedeForProduct && is.producto_id === p.id))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.sabor} — {p.presentacion}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Stock Inicial</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                  value={newProductoSede.stock}
                  onChange={e => setNewProductoSede({ ...newProductoSede, stock: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="flex-1 py-3 text-sm font-medium text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-highest transition-all" onClick={() => setAddProductoSedeModalOpen(false)}>Cancelar</button>
                <button type="submit" disabled={savingFlavor} className="flex-1 py-3 bg-primary text-on-primary rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                  {savingFlavor ? <><span className="material-symbols-outlined animate-spin">sync</span> Guardando...</> : 'Agregar'}
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
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Tamaño (Oz)</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. 7 oz"
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

      {/* Modal: Editar Sede */}
      {editSedeModalOpen && sedeToEdit && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
          onClick={() => { setEditSedeModalOpen(false); setSedeToEdit(null); }}
        >
          <div
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-semibold text-xl text-on-surface">Renombrar Sede</h3>
              <button
                className="text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => { setEditSedeModalOpen(false); setSedeToEdit(null); }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditSede} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Nombre de la Sede</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. Guatire, Centro, etc."
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface"
                  value={sedeToEdit.nombre}
                  onChange={(e) => setSedeToEdit({ ...sedeToEdit, nombre: e.target.value })}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  className="flex-1 py-3 text-sm font-medium text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-highest transition-all"
                  onClick={() => { setEditSedeModalOpen(false); setSedeToEdit(null); }}
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
