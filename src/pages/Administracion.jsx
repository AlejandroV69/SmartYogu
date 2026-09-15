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
  const [addFlavorModalOpen, setAddFlavorModalOpen] = useState(false);
  const [editFlavorModalOpen, setEditFlavorModalOpen] = useState(false);
  const [addVariantModalOpen, setAddVariantModalOpen] = useState(false);
  const [selectedFlavorForVariant, setSelectedFlavorForVariant] = useState('');
  const [flavorToEdit, setFlavorToEdit] = useState(null);
  const [newFlavor, setNewFlavor] = useState({ sabor: '', presentacion: '', precio: '', stock: '' });
  const [newVariant, setNewVariant] = useState({ presentacion: '', precio: '', stock: '' });
  const [savingFlavor, setSavingFlavor] = useState(false);

  // ── Lotes de Producción ────────────────────────────────────────
  const [lotes, setLotes] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [loteItems, setLoteItems] = useState([]);   // { lote_id, producto_id, cantidad }
  const [expandedLoteId, setExpandedLoteId] = useState(null);
  const [loteModalOpen, setLoteModalOpen] = useState(false);
  const [savingLote, setSavingLote] = useState(false);
  const [newLote, setNewLote] = useState({
    fecha_produccion: new Date().toISOString().split('T')[0],
    notas: '',
    items: [{ producto_id: '', cantidad: '' }],
  });

  // ── Estadísticas ─────────────────────────────────────────────
  const now = new Date();
  const [statsMonth, setStatsMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });

  // ── Tema Claro / Oscuro ──────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('smartyogu_theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('smartyogu_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // ── Configuración de Pago Móvil ──────────────────────────────────
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

  // ── Tasa BCV & Calculadora ───────────────────────────────────────
  const [bcvRate, setBcvRate] = useState(null);
  const [loadingBcv, setLoadingBcv] = useState(false);
  const [bcvError, setBcvError] = useState(null);
  const [montoUSD, setMontoUSD] = useState('10');
  const [copiedKey, setCopiedKey] = useState('');

  const fetchBCVRate = async () => {
    setLoadingBcv(true);
    setBcvError(null);
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      const data = await res.json();
      if (data && data.promedio) {
        setBcvRate(data.promedio);
      } else {
        setBcvError('No se pudo obtener la tasa de la API.');
      }
    } catch (err) {
      console.error('Error cargando tasa BCV:', err);
      setBcvError('Error de red al consultar tasa BCV.');
    } finally {
      setLoadingBcv(false);
    }
  };

  useEffect(() => {
    fetchBCVRate();
  }, []);

  // ── Datos ─────────────────────────────────────────────────────────
  const [inventario, setInventario] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [inventarioSedes, setInventarioSedes] = useState([]);
  const [selectedSedeTab, setSelectedSedeTab] = useState(null);
  const [loadingInv, setLoadingInv] = useState(true);
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

  // ── GET: lotes + lote_items ──────────────────────────────────
  const fetchLotes = async () => {
    setLoadingLotes(true);
    const { data: lotesData } = await supabase
      .from('lotes')
      .select('*')
      .order('fecha_produccion', { ascending: false });
    if (lotesData) setLotes(lotesData);

    const { data: itemsData } = await supabase
      .from('lote_items')
      .select('*, inventario(sabor, presentacion)');
    if (itemsData) setLoteItems(itemsData);
    setLoadingLotes(false);
  };

  useEffect(() => {
    fetchLotes();
  }, [activeTab === 'Lotes']);

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

    // Lote más reciente disponible (para trazabilidad)
    const loteReciente = lotes.length > 0 ? lotes[0] : null;
    const loteId = loteReciente?.id ?? null;

    if (existing) {
      // Actualización optimista
      setInventarioSedes(prev => prev.map(i =>
        i.id === existing.id ? { ...i, stock: nuevoStock, lote_id: loteId } : i
      ));
      const { error } = await supabase
        .from('inventario_sedes')
        .update({ stock: nuevoStock, lote_id: loteId })
        .eq('id', existing.id);
      if (error) {
        setInventarioSedes(prev => prev.map(i => i.id === existing.id ? { ...i, stock: currentStock } : i));
        setError(`Error al actualizar stock: ${error.message}`);
      }
    } else if (nuevoStock > 0) {
      // Crear nueva fila (primera vez que se añade stock a esta sede)
      const { data, error } = await supabase
        .from('inventario_sedes')
        .insert([{ sede_id: sedeId, producto_id: productoId, stock: nuevoStock, lote_id: loteId }])
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

  // Retorna info del lote vinculado a un item de inventario_sedes
  const getLoteDeSedeItem = (sedeId, productoId) => {
    const item = inventarioSedes.find(i => i.sede_id === sedeId && i.producto_id === productoId);
    if (!item?.lote_id) return null;
    return lotes.find(l => l.id === item.lote_id) || null;
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

  // ── POST: guardar lote de producción ────────────────────────────
  const handleSaveLote = async (e) => {
    e.preventDefault();
    const itemsValidos = newLote.items.filter(i => i.producto_id && parseInt(i.cantidad) > 0);
    if (itemsValidos.length === 0) {
      setError('Agrega al menos un producto con cantidad mayor a 0.');
      return;
    }
    setSavingLote(true);

    // Generar número de lote: L-YYYY-NNN
    const year = new Date().getFullYear();
    const nroActual = lotes.filter(l => l.numero_lote.startsWith(`L-${year}`)).length + 1;
    const numeroLote = `L-${year}-${String(nroActual).padStart(3, '0')}`;

    // 1. Insertar el lote
    const { data: loteData, error: loteError } = await supabase
      .from('lotes')
      .insert([{ numero_lote: numeroLote, fecha_produccion: newLote.fecha_produccion, notas: newLote.notas || null }])
      .select();

    if (loteError || !loteData) {
      setError(`Error creando lote: ${loteError?.message}`);
      setSavingLote(false);
      return;
    }
    const loteId = loteData[0].id;

    // 2. Insertar los ítems del lote
    const { error: itemsError } = await supabase
      .from('lote_items')
      .insert(itemsValidos.map(i => ({ lote_id: loteId, producto_id: parseInt(i.producto_id), cantidad: parseInt(i.cantidad) })));

    if (itemsError) {
      setError(`Error guardando ítems del lote: ${itemsError.message}`);
      setSavingLote(false);
      return;
    }

    // 3. Sumar al stock de inventario (campo stock en inventario)
    for (const item of itemsValidos) {
      const prod = inventario.find(p => p.id === parseInt(item.producto_id));
      if (!prod) continue;
      const nuevoStock = (prod.stock || 0) + parseInt(item.cantidad);
      await supabase.from('inventario').update({ stock: nuevoStock }).eq('id', prod.id);
    }

    // 4. Refrescar estado local
    setInventario(prev => prev.map(p => {
      const it = itemsValidos.find(i => parseInt(i.producto_id) === p.id);
      return it ? { ...p, stock: (p.stock || 0) + parseInt(it.cantidad) } : p;
    }));
    setLotes(prev => [loteData[0], ...prev]);
    await fetchLotes();

    setLoteModalOpen(false);
    setNewLote({ fecha_produccion: new Date().toISOString().split('T')[0], notas: '', items: [{ producto_id: '', cantidad: '' }] });
    setSavingLote(false);
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
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center p-1.5 shadow-md shrink-0">
            <img src="/favicon.png" alt="THÖRGURT Logo" className="w-full h-full object-contain drop-shadow" />
          </div>
          <h1 className="text-primary tracking-tight font-bold text-2xl">THÖRGURT Admin</h1>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {[
            { icon: 'dashboard', label: 'Inicio', id: 'Dashboard' },
            { icon: 'inventory_2', label: 'Inventario', id: 'Inventory' },
            { icon: 'store', label: 'Sedes', id: 'Sedes' },
            { icon: 'science', label: 'Lotes', id: 'Lotes' },
            { icon: 'bar_chart', label: 'Estadísticas', id: 'Stats' },
            { icon: 'payments', label: 'Datos de Pago', id: 'PagoMovil' },
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
                placeholder="Buscar sabor o presentación..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Toggle Tema Claro / Oscuro */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-highest border border-outline-variant text-on-surface hover:text-primary hover:border-primary/50 transition-all active:scale-95 text-xs font-semibold shadow-sm"
              title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
              <span className="hidden sm:inline">
                {theme === 'light' ? 'Oscuro' : 'Claro'}
              </span>
            </button>

            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center cursor-pointer hover:scale-105 transition-transform overflow-hidden border border-outline-variant">
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
                  Suma total de unidades físicas en todas las sedes
                </p>
              </div>

              {/* KPI: Total Sabores */}
              <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start text-on-surface-variant">
                    <span className="text-xs uppercase font-bold tracking-wider">Sabores Registrados</span>
                    <span className="material-symbols-outlined text-secondary">palette</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-on-surface mt-2 tracking-tight">
                    {getInventarioAgrupado().length}
                  </h3>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-3">
                  Líneas de sabores activas en catálogo
                </p>
              </div>

              {/* KPI: Presentaciones / Productos */}
              <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start text-on-surface-variant">
                    <span className="text-xs uppercase font-bold tracking-wider">Presentaciones</span>
                    <span className="material-symbols-outlined text-tertiary">layers</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-on-surface mt-2 tracking-tight">
                    {inventario.length}
                  </h3>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-3">
                  Variantes de tamaño y empaque en inventario
                </p>
              </div>

              {/* KPI: Sedes Activas */}
              <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start text-on-surface-variant">
                    <span className="text-xs uppercase font-bold tracking-wider">Sedes Activas</span>
                    <span className="material-symbols-outlined text-green-500">store</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-on-surface mt-2 tracking-tight">
                    {sedes.filter(s => s.activa).length}
                  </h3>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-3">
                  Puntos de venta operativos registrados
                </p>
              </div>
            </section>
          )}

          {/* KPIs por Sede */}
          {activeTab === 'Dashboard' && sedes.length > 0 && (
            <section className="space-y-4">
              <h3 className="font-extrabold text-sm md:text-base text-on-surface uppercase tracking-wider">
                Stock por Sede
              </h3>
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
                  const porcentajeStock = inventario.length > 0 ? Math.min(100, Math.round((productosCargados / inventario.length) * 100)) : 0;

                  return (
                    <div
                      key={sede.id}
                      className="group bg-surface-container border border-outline-variant rounded-2xl p-5 flex flex-col justify-between gap-4 cursor-pointer hover:border-primary/50 hover:bg-surface-container-high transition-all shadow-sm"
                      onClick={() => { setSelectedSedeTab(sede.id); setActiveTab('Sedes'); }}
                    >
                      {/* Top Bar: Icon + Name + Badge */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-[20px]">store</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-on-surface text-base leading-snug">{sede.nombre}</h4>
                            <span className={`inline-block text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md mt-0.5 ${
                              sede.activa ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-error/15 text-error border border-error/30'
                            }`}>
                              {sede.activa ? 'ACTIVA' : 'INACTIVA'}
                            </span>
                          </div>
                        </div>

                        {productosBajos > 0 && (
                          <div className="px-2.5 py-1 rounded-full bg-surface-container-highest border border-outline-variant text-[11px] font-bold text-on-surface flex items-center gap-1.5 shadow-xs">
                            <span className="material-symbols-outlined text-amber-400 text-[14px]">warning</span>
                            <span>{productosBajos} bajo</span>
                          </div>
                        )}
                      </div>

                      {/* Numbers Row */}
                      <div className="flex items-end justify-between pt-1">
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-1">Stock Total</p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-on-surface tabular-nums leading-none">{totalUnidadesSede}</span>
                            <span className="text-xs text-on-surface-variant font-medium">unidades</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-1">Variantes</p>
                          <p className="text-sm font-bold text-on-surface tabular-nums">
                            <span className="text-base font-extrabold">{productosCargados}</span>
                            <span className="text-xs text-on-surface-variant font-normal ml-1">de {inventario.length}</span>
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${porcentajeStock}%` }}
                        />
                      </div>

                      {/* Bottom Link */}
                      <div className="flex items-center justify-between pt-1 border-t border-outline-variant/40 text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
                        <span>Gestionar inventario</span>
                        <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                      </div>
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

                      texto += `- - - - - - - - - - - - -\n📦 Hacemos delivery\n📲 ¡Escríbenos para hacer tu pedido!`;

                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(texto);
                      } else {
                        const ta = document.createElement('textarea');
                        ta.value = texto;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                      }
                      setCopiedKey('share_global');
                      setTimeout(() => setCopiedKey(''), 2000);
                    }}
                    title="Copiar lista global de productos disponibles"
                  >
                    <span className="material-symbols-outlined text-[18px]">{copiedKey === 'share_global' ? 'check' : 'share'}</span>
                    <span className="hidden md:inline">{copiedKey === 'share_global' ? '¡Copiado!' : 'Compartir Disponibilidad'}</span>
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
                        
                        texto += `- - - - - - - - - - - - -\n📦 Hacemos delivery\n📲 ¡Escríbenos para hacer tu pedido!`;

                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(texto);
                        } else {
                          const ta = document.createElement('textarea');
                          ta.value = texto;
                          document.body.appendChild(ta);
                          ta.select();
                          document.execCommand('copy');
                          document.body.removeChild(ta);
                        }
                        setCopiedKey('share_sede');
                        setTimeout(() => setCopiedKey(''), 2000);
                      }}
                      title="Copiar lista de productos disponibles en esta sede"
                    >
                      <span className="material-symbols-outlined text-[18px]">{copiedKey === 'share_sede' ? 'check' : 'share'}</span>
                      <span className="hidden md:inline">{copiedKey === 'share_sede' ? '¡Copiado!' : 'Compartir Disponibilidad'}</span>
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
                                        <div className="flex justify-between items-start mb-2 gap-2">
                                          <div>
                                            <span className="text-sm font-bold text-on-surface">{item.presentacion}</span>
                                            <span className="text-xs text-on-surface-variant ml-2">${Number(item.precio).toFixed(2)}</span>
                                          </div>
                                          {/* Chip: Lote de origen */}
                                          {(() => {
                                            const loteItem = getLoteDeSedeItem(selectedSedeTab, item.id);
                                            return loteItem ? (
                                              <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                                                <span className="material-symbols-outlined text-[9px]">science</span>
                                                {loteItem.numero_lote}
                                                <span className="text-primary/60 ml-0.5">
                                                  · {new Date(loteItem.fecha_produccion + 'T00:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
                                                </span>
                                              </span>
                                            ) : null;
                                          })()}
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

          {/* ── Sección 4: Datos de Pago & Conversión BCV ────────────────────────── */}
          {activeTab === 'PagoMovil' && (
            <section id="pago-movil" className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h3 className="font-semibold text-xl md:text-2xl text-on-surface">Datos de Pago Móvil & Conversión</h3>
                  <p className="text-on-surface-variant text-sm font-medium">
                    Calculadora con Tasa Oficial del BCV y herramientas de copiado rápido para clientes
                  </p>
                </div>
                {/* Card Tasa BCV */}
                <div className="bg-surface-container border border-outline-variant rounded-xl px-5 py-3 flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    <span className="material-symbols-outlined">currency_exchange</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">Tasa BCV Oficial</span>
                    <div className="text-xl font-extrabold text-on-surface">
                      {loadingBcv ? (
                        <span className="text-sm text-on-surface-variant animate-pulse">Cargando...</span>
                      ) : bcvRate ? (
                        <span>{Number(bcvRate).toFixed(2)} <span className="text-xs font-normal text-on-surface-variant">Bs/$</span></span>
                      ) : (
                        <span className="text-xs text-error">Sin conexión</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={fetchBCVRate}
                    disabled={loadingBcv}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest rounded-full transition-all active:scale-90"
                    title="Actualizar tasa BCV"
                  >
                    <span className={`material-symbols-outlined text-[20px] ${loadingBcv ? 'animate-spin' : ''}`}>sync</span>
                  </button>
                </div>
              </div>

              {bcvError && (
                <div className="p-3 bg-error-container/20 border border-error/30 rounded-lg flex items-center justify-between text-xs text-error">
                  <span>{bcvError} Puedes ingresar la tasa manualmente si lo necesitas.</span>
                  <button
                    onClick={() => {
                      const manual = prompt('Ingresa la tasa BCV (Bs/$):', bcvRate || '45.00');
                      if (manual && !isNaN(manual)) setBcvRate(parseFloat(manual));
                    }}
                    className="underline font-bold ml-2"
                  >
                    Editar tasa
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna 1 & 2: Calculadora y Acciones de Copiado Rápido */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Card Calculadora */}
                  <div className="bg-surface-container border border-outline-variant rounded-xl p-6 space-y-6 shadow-sm">
                    <h4 className="font-semibold text-lg text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined">calculate</span>
                      Calculadora de Conversión USD ➔ Bolívares
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div>
                        <label className="text-xs font-bold uppercase text-on-surface-variant block mb-1">Monto en Dólares ($ USD)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-on-surface-variant font-bold">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-8 pr-4 py-3 font-extrabold text-xl text-on-surface focus:border-primary focus:outline-none"
                            value={montoUSD}
                            onChange={(e) => setMontoUSD(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        {/* Botones de acceso rápido a montos frecuentes */}
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {['5', '10', '15', '20', '50'].map(val => (
                            <button
                              key={val}
                              onClick={() => setMontoUSD(val)}
                              className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-all ${
                                montoUSD === val
                                  ? 'bg-primary text-on-primary border-primary'
                                  : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container-highest'
                              }`}
                            >
                              ${val}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Resultado en Bs */}
                      <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex flex-col justify-between h-full min-h-[100px]">
                        <span className="text-xs font-bold uppercase text-primary tracking-wider">Total a Pagar en Bolívares</span>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-3xl font-extrabold text-on-surface tracking-tight">
                            {montoUSD && bcvRate
                              ? (parseFloat(montoUSD) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : '0,00'} <span className="text-base font-normal text-on-surface-variant">Bs</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1">
                          Calculado a tasa BCV: <strong className="text-on-surface">{bcvRate ? `${Number(bcvRate).toFixed(2)} Bs/$` : '—'}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Botones de copiado rápido individual */}
                    <div className="border-t border-outline-variant pt-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Copiar Datos Rápidos para Banca Móvil</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Copiar Monto en Bs */}
                        <button
                          onClick={() => {
                            const montoBs = montoUSD && bcvRate ? (parseFloat(montoUSD) * bcvRate).toFixed(2) : '0.00';
                            navigator.clipboard.writeText(montoBs);
                            setCopiedKey('monto');
                            setTimeout(() => setCopiedKey(''), 2000);
                          }}
                          className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant rounded-lg hover:border-primary transition-all text-left active:scale-95 group"
                        >
                          <div>
                            <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Monto en Bs</span>
                            <span className="text-sm font-extrabold text-primary">
                              {montoUSD && bcvRate ? (parseFloat(montoUSD) * bcvRate).toFixed(2) : '0.00'} Bs
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary">
                            {copiedKey === 'monto' ? 'check' : 'content_copy'}
                          </span>
                        </button>

                        {/* Copiar Teléfono */}
                        <button
                          onClick={() => {
                            const clean = pagoMovilConfig.telefono.replace(/\D/g, '');
                            navigator.clipboard.writeText(clean);
                            setCopiedKey('telefono');
                            setTimeout(() => setCopiedKey(''), 2000);
                          }}
                          className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant rounded-lg hover:border-primary transition-all text-left active:scale-95 group"
                        >
                          <div>
                            <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Teléfono</span>
                            <span className="text-sm font-bold text-on-surface">{pagoMovilConfig.telefono}</span>
                          </div>
                          <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary">
                            {copiedKey === 'telefono' ? 'check' : 'content_copy'}
                          </span>
                        </button>

                        {/* Copiar Cédula */}
                        <button
                          onClick={() => {
                            const clean = pagoMovilConfig.cedula.replace(/\D/g, '');
                            navigator.clipboard.writeText(clean);
                            setCopiedKey('cedula');
                            setTimeout(() => setCopiedKey(''), 2000);
                          }}
                          className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant rounded-lg hover:border-primary transition-all text-left active:scale-95 group"
                        >
                          <div>
                            <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Cédula / RIF</span>
                            <span className="text-sm font-bold text-on-surface">{pagoMovilConfig.cedula}</span>
                          </div>
                          <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary">
                            {copiedKey === 'cedula' ? 'check' : 'content_copy'}
                          </span>
                        </button>

                        {/* Copiar Banco */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(pagoMovilConfig.banco);
                            setCopiedKey('banco');
                            setTimeout(() => setCopiedKey(''), 2000);
                          }}
                          className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant rounded-lg hover:border-primary transition-all text-left active:scale-95 group"
                        >
                          <div>
                            <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Banco</span>
                            <span className="text-sm font-bold text-on-surface truncate max-w-[120px]">{pagoMovilConfig.banco}</span>
                          </div>
                          <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary">
                            {copiedKey === 'banco' ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Copiar Plantilla Completa para WhatsApp */}
                    <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h5 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-green-500 text-base">chat</span>
                          Plantilla Completa para WhatsApp
                        </h5>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Copia la ficha de pago lista con el monto exacto en Bolívares para enviar a clientes.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const cleanCedula = pagoMovilConfig.cedula.replace(/\D/g, '');
                          const cleanTelefono = pagoMovilConfig.telefono.replace(/\D/g, '');
                          const montoBs = montoUSD && bcvRate ? (parseFloat(montoUSD) * bcvRate).toFixed(2) : '0.00';
                          
                          const texto = `Banco: ${pagoMovilConfig.banco}\nCédula: ${cleanCedula}\nTeléfono: ${cleanTelefono}\nMonto: ${montoBs} Bs`;

                          navigator.clipboard.writeText(texto);
                          setCopiedKey('whatsapp');
                          setTimeout(() => setCopiedKey(''), 2000);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {copiedKey === 'whatsapp' ? 'check' : 'content_copy'}
                        </span>
                        {copiedKey === 'whatsapp' ? '¡Copiado!' : 'Copiar para WhatsApp / Banco'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Columna 3: Formulario de Configuración de Datos de Pago */}
                <div className="bg-surface-container border border-outline-variant rounded-xl p-6 space-y-4 shadow-sm h-fit">
                  <div>
                    <h4 className="font-semibold text-lg text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">settings</span>
                      Configurar Datos Bancarios
                    </h4>
                    <p className="text-on-surface-variant text-xs mt-1">
                      Estos datos se guardan de manera permanente en este navegador.
                    </p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSavingConfig(true);
                      localStorage.setItem('smartyogu_pagomovil_config', JSON.stringify(editPagoMovil));
                      setPagoMovilConfig({ ...editPagoMovil });
                      
                      window.dispatchEvent(new Event('storage'));
                      
                      setTimeout(() => {
                        setSavingConfig(false);
                        setCopiedKey('config_saved');
                        setTimeout(() => setCopiedKey(''), 2500);
                      }, 300);
                    }}
                    className="space-y-4 pt-2"
                  >
                    <div>
                      <label className="text-xs font-bold uppercase text-on-surface-variant block mb-1">Banco</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:outline-none text-on-surface font-medium"
                        value={editPagoMovil.banco}
                        onChange={(e) => setEditPagoMovil({ ...editPagoMovil, banco: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-on-surface-variant block mb-1">Cédula / RIF</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:outline-none text-on-surface font-medium"
                        value={editPagoMovil.cedula}
                        onChange={(e) => setEditPagoMovil({ ...editPagoMovil, cedula: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-on-surface-variant block mb-1">Teléfono</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:outline-none text-on-surface font-medium"
                        value={editPagoMovil.telefono}
                        onChange={(e) => setEditPagoMovil({ ...editPagoMovil, telefono: e.target.value })}
                      />
                    </div>
                    
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={savingConfig}
                        className={`w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer active:scale-95 shadow-md ${
                          copiedKey === 'config_saved'
                            ? 'bg-green-600 text-white'
                            : 'bg-primary text-on-primary hover:brightness-110'
                        }`}
                      >
                        {savingConfig ? (
                          <><span className="material-symbols-outlined animate-spin text-sm">sync</span> Guardando...</>
                        ) : copiedKey === 'config_saved' ? (
                          <><span className="material-symbols-outlined text-sm">check</span> ¡Guardado exitosamente!</>
                        ) : (
                          'Guardar Cambios'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* ── Sección: Lotes de Producción ───────────────────────── */}
          {activeTab === 'Lotes' && (
            <section className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-xl text-on-surface">Lotes de Producción</h3>
                  <p className="text-sm text-on-surface-variant">Historial de producciones registradas</p>
                </div>
                <button
                  className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md"
                  onClick={() => setLoteModalOpen(true)}
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Registrar Lote
                </button>
              </div>

              {/* Lista de lotes */}
              {loadingLotes ? (
                <div className="space-y-3">
                  {[1,2,3].map(n => <div key={n} className="h-20 bg-surface-container rounded-xl animate-pulse border border-outline-variant" />)}
                </div>
              ) : lotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">science</span>
                  <p className="text-on-surface font-semibold">Sin lotes registrados</p>
                  <p className="text-sm text-on-surface-variant mt-1">Registra tu primer lote de producción</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lotes.map(lote => {
                    const items = loteItems.filter(i => i.lote_id === lote.id);
                    const totalUnidades = items.reduce((s, i) => s + i.cantidad, 0);
                    const saboresUnicos = [...new Set(items.map(i => i.inventario?.sabor).filter(Boolean))];
                    const isExpanded = expandedLoteId === lote.id;
                    return (
                      <div key={lote.id} className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden transition-all">
                        {/* Fila principal */}
                        <button
                          type="button"
                          className="w-full flex items-center justify-between gap-4 p-5 hover:bg-surface-container-high transition-colors text-left"
                          onClick={() => setExpandedLoteId(isExpanded ? null : lote.id)}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-primary text-[20px]">science</span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-on-surface text-sm">{lote.numero_lote}</span>
                                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                                  {totalUnidades} uds.
                                </span>
                              </div>
                              <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                                {new Date(lote.fecha_produccion + 'T00:00:00').toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                                {saboresUnicos.length > 0 && <span className="ml-2 text-on-surface-variant/70">· {saboresUnicos.join(', ')}</span>}
                              </p>
                            </div>
                          </div>
                          <span className={`material-symbols-outlined text-on-surface-variant text-[20px] shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>

                        {/* Detalle del lote (expandible) */}
                        {isExpanded && (
                          <div className="border-t border-outline-variant px-5 pb-5 pt-4 space-y-3">
                            {lote.notas && (
                              <p className="text-xs text-on-surface-variant italic bg-surface-container-high rounded-lg px-3 py-2">{lote.notas}</p>
                            )}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-[10px] uppercase font-bold text-on-surface-variant border-b border-outline-variant">
                                    <th className="text-left pb-2">Sabor</th>
                                    <th className="text-left pb-2">Presentación</th>
                                    <th className="text-right pb-2">Cantidad</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/40">
                                  {items.map(item => (
                                    <tr key={item.id} className="hover:bg-surface-container-high/50">
                                      <td className="py-2 font-medium text-on-surface">{item.inventario?.sabor ?? '—'}</td>
                                      <td className="py-2 text-on-surface-variant">{item.inventario?.presentacion ?? '—'}</td>
                                      <td className="py-2 text-right font-bold text-primary tabular-nums">{item.cantidad}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t border-outline-variant">
                                    <td colSpan={2} className="pt-2 text-xs font-bold text-on-surface-variant uppercase tracking-wide">Total del Lote</td>
                                    <td className="pt-2 text-right font-black text-on-surface tabular-nums">{totalUnidades}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── Sección: Estadísticas ─────────────────────────────── */}
          {activeTab === 'Stats' && (() => {
            // ─ Calcular rango del mes seleccionado ────────────────────────
            const { year, month } = statsMonth;
            const mesInicio = new Date(year, month, 1);
            const mesFin = new Date(year, month + 1, 0);

            // Lotes del mes
            const lotesMes = lotes.filter(l => {
              const d = new Date(l.fecha_produccion + 'T00:00:00');
              return d >= mesInicio && d <= mesFin;
            });

            // Items de esos lotes
            const itemsMes = loteItems.filter(i => lotesMes.some(l => l.id === i.lote_id));

            // KPI: total unidades
            const totalUds = itemsMes.reduce((s, i) => s + i.cantidad, 0);

            // KPI: sabor estrella
            const porSabor = itemsMes.reduce((acc, i) => {
              const s = i.inventario?.sabor || 'Sin nombre';
              acc[s] = (acc[s] || 0) + i.cantidad;
              return acc;
            }, {});
            const saborEstrella = Object.entries(porSabor).sort((a, b) => b[1] - a[1])[0];
            const maxSaborVal = saborEstrella?.[1] || 1;

            // KPI: presentación líder
            const porPresentacion = itemsMes.reduce((acc, i) => {
              const p = i.inventario?.presentacion || 'Sin nombre';
              acc[p] = (acc[p] || 0) + i.cantidad;
              return acc;
            }, {});
            const presLider = Object.entries(porPresentacion).sort((a, b) => b[1] - a[1])[0];
            const totalPres = Object.values(porPresentacion).reduce((s, v) => s + v, 0) || 1;

            // KPI: Stock total en todas las sedes
            const stockTotal = inventarioSedes.reduce((s, i) => s + i.stock, 0);

            // Nombre del mes
            const nombreMes = mesInicio.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });

            // Sedes ordenadas por stock
            const sedesConStock = sedes.map(s => ({
              ...s,
              stock: inventarioSedes.filter(i => i.sede_id === s.id).reduce((sum, i) => sum + i.stock, 0),
            })).sort((a, b) => b.stock - a.stock);
            const maxStockSede = sedesConStock[0]?.stock || 1;

            const prevMonth = () => setStatsMonth(prev => {
              const d = new Date(prev.year, prev.month - 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            });
            const nextMonth = () => setStatsMonth(prev => {
              const d = new Date(prev.year, prev.month + 1, 1);
              if (d > new Date()) return prev;
              return { year: d.getFullYear(), month: d.getMonth() };
            });
            const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

            return (
              <section className="space-y-6">
                {/* Header con selector de mes */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-xl text-on-surface">Estadísticas de Producción</h3>
                    <p className="text-sm text-on-surface-variant">Resumen mensual estratégico</p>
                  </div>
                  {/* Selector de mes */}
                  <div className="flex items-center gap-2 bg-surface-container border border-outline-variant rounded-xl p-1">
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-all"
                      onClick={prevMonth}
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <span className="text-sm font-semibold text-on-surface px-2 capitalize min-w-[160px] text-center">{nombreMes}</span>
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-all disabled:opacity-30"
                      onClick={nextMonth}
                      disabled={isCurrentMonth}
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { icon: 'science', label: 'Lotes del Mes', value: lotesMes.length, unit: 'lotes', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
                    { icon: 'inventory_2', label: 'Uds. Producidas', value: totalUds, unit: 'unidades', color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20' },
                    { icon: 'star', label: 'Sabor Estrella', value: saborEstrella?.[0] ?? '—', unit: saborEstrella ? `${saborEstrella[1]} uds.` : '', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
                    { icon: 'straighten', label: 'Tamaño Líder', value: presLider?.[0] ?? '—', unit: presLider ? `${Math.round((presLider[1] / totalPres) * 100)}%` : '', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
                    { icon: 'inventory', label: 'Stock Total', value: stockTotal, unit: 'en sistema', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
                    { icon: 'store', label: 'Sedes Activas', value: sedes.filter(s => s.activa).length, unit: `de ${sedes.length}`, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
                  ].map((kpi, idx) => (
                    <div key={idx} className={`bg-surface-container border ${kpi.border} rounded-2xl p-4 flex flex-col gap-2`}>
                      <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>
                        <span className={`material-symbols-outlined text-[16px] ${kpi.color}`}>{kpi.icon}</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wide leading-none mb-1">{kpi.label}</p>
                        <p className={`text-xl font-black leading-none tabular-nums ${kpi.color}`}>{kpi.value}</p>
                        {kpi.unit && <p className="text-[10px] text-on-surface-variant mt-0.5">{kpi.unit}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gráficas: Sabor + Presentación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Producción por Sabor */}
                  <div className="bg-surface-container border border-outline-variant rounded-2xl p-5">
                    <h4 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">bar_chart</span>
                      Producción por Sabor
                    </h4>
                    {Object.keys(porSabor).length === 0 ? (
                      <div className="flex items-center justify-center h-24 text-center">
                        <p className="text-sm text-on-surface-variant">Sin datos para este mes</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(porSabor).sort((a, b) => b[1] - a[1]).map(([sabor, qty]) => (
                          <div key={sabor}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-on-surface">{sabor}</span>
                              <span className="text-xs font-black text-primary tabular-nums">{qty} uds.</span>
                            </div>
                            <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-700"
                                style={{ width: `${Math.round((qty / maxSaborVal) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Producción por Presentación */}
                  <div className="bg-surface-container border border-outline-variant rounded-2xl p-5">
                    <h4 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-[18px]">donut_large</span>
                      Distribución por Tamaño
                    </h4>
                    {Object.keys(porPresentacion).length === 0 ? (
                      <div className="flex items-center justify-center h-24 text-center">
                        <p className="text-sm text-on-surface-variant">Sin datos para este mes</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(porPresentacion).sort((a, b) => b[1] - a[1]).map(([pres, qty], idx) => {
                          const pct = Math.round((qty / totalPres) * 100);
                          const colors = ['bg-primary', 'bg-tertiary', 'bg-sky-400', 'bg-orange-400', 'bg-green-400'];
                          const textColors = ['text-primary', 'text-tertiary', 'text-sky-400', 'text-orange-400', 'text-green-400'];
                          return (
                            <div key={pres}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-semibold text-on-surface">{pres}</span>
                                <span className={`text-xs font-black tabular-nums ${textColors[idx % textColors.length]}`}>{pct}% · {qty} uds.</span>
                              </div>
                              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-700`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline de Lotes del Mes */}
                <div className="bg-surface-container border border-outline-variant rounded-2xl p-5">
                  <h4 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">timeline</span>
                    Timeline de Lotes — <span className="capitalize font-normal text-on-surface-variant">{nombreMes}</span>
                  </h4>
                  {lotesMes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">science</span>
                      <p className="text-sm text-on-surface-variant">No se registraron lotes en {nombreMes}</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Línea vertical */}
                      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-outline-variant" />
                      <div className="space-y-4">
                        {[...lotesMes].sort((a, b) => new Date(a.fecha_produccion) - new Date(b.fecha_produccion)).map(lote => {
                          const items = loteItems.filter(i => i.lote_id === lote.id);
                          const total = items.reduce((s, i) => s + i.cantidad, 0);
                          const sabores = [...new Set(items.map(i => i.inventario?.sabor).filter(Boolean))];
                          return (
                            <div key={lote.id} className="flex gap-4 items-start relative">
                              {/* Punto del timeline */}
                              <div className="w-10 h-10 rounded-full bg-surface-container-highest border-2 border-primary flex items-center justify-center shrink-0 z-10">
                                <span className="material-symbols-outlined text-primary text-[16px]">science</span>
                              </div>
                              <div className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl p-3 pb-3">
                                <div className="flex justify-between items-start gap-2 flex-wrap">
                                  <div>
                                    <span className="font-bold text-sm text-on-surface">{lote.numero_lote}</span>
                                    <span className="text-xs text-on-surface-variant ml-2 capitalize">
                                      {new Date(lote.fecha_produccion + 'T00:00:00').toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                  </div>
                                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                                    {total} uds.
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {sabores.map(s => (
                                    <span key={s} className="text-[9px] bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded font-medium">{s}</span>
                                  ))}
                                </div>
                                {lote.notas && (
                                  <p className="text-[10px] text-on-surface-variant mt-1.5 italic">{lote.notas}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Stock por Sede */}
                <div className="bg-surface-container border border-outline-variant rounded-2xl p-5">
                  <h4 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">store</span>
                    Stock Actual por Sede
                  </h4>
                  {sedesConStock.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">Sin sedes registradas.</p>
                  ) : (
                    <div className="space-y-4">
                      {sedesConStock.map(sede => (
                        <div key={sede.id}>
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">store</span>
                              <span className="text-sm font-semibold text-on-surface">{sede.nombre}</span>
                              {!sede.activa && (
                                <span className="text-[9px] bg-error/20 text-error px-1.5 py-0.5 rounded font-bold">Inactiva</span>
                              )}
                            </div>
                            <span className={`text-sm font-black tabular-nums ${
                              sede.stock <= 20 ? 'text-error' : sede.stock <= 60 ? 'text-tertiary' : 'text-primary'
                            }`}>{sede.stock} uds.</span>
                          </div>
                          <div className="h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                sede.stock <= 20 ? 'bg-error' : sede.stock <= 60 ? 'bg-tertiary' : 'bg-primary'
                              }`}
                              style={{ width: `${Math.min(Math.round((sede.stock / maxStockSede) * 100), 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[9px] text-on-surface-variant">
                              {inventarioSedes.filter(i => i.sede_id === sede.id && i.stock > 0).length} productos con stock
                            </span>
                            <span className={`text-[9px] font-bold ${
                              sede.stock <= 20 ? 'text-error' : sede.stock <= 60 ? 'text-tertiary' : 'text-primary'
                            }`}>
                              {sede.stock <= 20 ? '⚠ CRÍTICO' : sede.stock <= 60 ? '! MEDIO' : '✓ OK'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </section>
            );
          })()}

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

      {/* Modal: Registrar Lote de Producción */}
      {loteModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
          onClick={() => setLoteModalOpen(false)}
        >
          <div
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-6 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface-container z-10">
              <div>
                <h3 className="font-bold text-xl text-on-surface">Registrar Lote</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Producción del día</p>
              </div>
              <button className="text-on-surface-variant hover:text-primary transition-colors" onClick={() => setLoteModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveLote} className="p-6 space-y-6">
              {/* Fecha */}
              <div>
                <label className="text-sm font-semibold text-on-surface-variant block mb-1.5">
                  <span className="material-symbols-outlined text-[14px] align-middle mr-1">calendar_today</span>
                  Fecha de Producción
                </label>
                <input
                  required
                  type="date"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:outline-none text-on-surface text-sm"
                  value={newLote.fecha_produccion}
                  onChange={e => setNewLote({ ...newLote, fecha_produccion: e.target.value })}
                />
              </div>

              {/* Notas */}
              <div>
                <label className="text-sm font-semibold text-on-surface-variant block mb-1.5">
                  <span className="material-symbols-outlined text-[14px] align-middle mr-1">notes</span>
                  Notas (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Observaciones del lote..."
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:outline-none text-on-surface text-sm resize-none"
                  value={newLote.notas}
                  onChange={e => setNewLote({ ...newLote, notas: e.target.value })}
                />
              </div>

              {/* Ítems del Lote */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px] align-middle mr-1">inventory_2</span>
                    Productos Producidos
                  </label>
                  <button
                    type="button"
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                    onClick={() => setNewLote(prev => ({ ...prev, items: [...prev.items, { producto_id: '', cantidad: '' }] }))}
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Añadir producto
                  </button>
                </div>

                <div className="space-y-3">
                  {newLote.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <select
                        required
                        className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none text-on-surface text-sm"
                        value={item.producto_id}
                        onChange={e => {
                          const updated = [...newLote.items];
                          updated[idx] = { ...updated[idx], producto_id: e.target.value };
                          setNewLote({ ...newLote, items: updated });
                        }}
                      >
                        <option value="">Sabor + Presentación...</option>
                        {inventario.map(p => (
                          <option key={p.id} value={p.id}>{p.sabor} — {p.presentacion}</option>
                        ))}
                      </select>
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="Uds."
                        className="w-24 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none text-on-surface text-sm text-center"
                        value={item.cantidad}
                        onChange={e => {
                          const updated = [...newLote.items];
                          updated[idx] = { ...updated[idx], cantidad: e.target.value };
                          setNewLote({ ...newLote, items: updated });
                        }}
                      />
                      {newLote.items.length > 1 && (
                        <button
                          type="button"
                          className="text-on-surface-variant hover:text-error p-2 rounded-lg hover:bg-error/10 transition-colors mt-0.5"
                          onClick={() => setNewLote(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Resumen de total */}
                {newLote.items.some(i => parseInt(i.cantidad) > 0) && (
                  <div className="mt-3 p-3 bg-primary/8 border border-primary/20 rounded-xl flex justify-between items-center">
                    <span className="text-xs font-semibold text-on-surface-variant">Total a producir</span>
                    <span className="text-lg font-black text-primary tabular-nums">
                      {newLote.items.reduce((s, i) => s + (parseInt(i.cantidad) || 0), 0)} uds.
                    </span>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-3 text-sm font-medium text-on-surface-variant border border-outline-variant rounded-xl hover:bg-surface-container-highest transition-all"
                  onClick={() => setLoteModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingLote}
                  className="flex-1 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:brightness-110 active:scale-95"
                >
                  {savingLote ? (
                    <><span className="material-symbols-outlined animate-spin text-sm">sync</span> Guardando...</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">check</span> Confirmar Lote</>
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
