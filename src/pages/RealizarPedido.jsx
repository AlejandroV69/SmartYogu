import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Emojis por sabor para que sea más visual y representativo
const FLAVOR_META = {
  default: { emoji: '🥣', color: 'border-primary bg-primary/10' },
  fresa: { emoji: '🍓', color: 'border-red-400 bg-red-400/10' },
  melocoton: { emoji: '🍑', color: 'border-orange-400 bg-orange-400/10' },
  melocotón: { emoji: '🍑', color: 'border-orange-400 bg-orange-400/10' },
  durazno: { emoji: '🍑', color: 'border-orange-400 bg-orange-400/10' },
  natural: { emoji: '🥛', color: 'border-gray-300 bg-gray-200/20' },
  mix: { emoji: '✨', color: 'border-purple-400 bg-purple-400/10' },
  mango: { emoji: '🥭', color: 'border-yellow-400 bg-yellow-400/10' },
  coco: { emoji: '🥥', color: 'border-stone-400 bg-stone-400/10' },
  arandano: { emoji: '🫐', color: 'border-blue-500 bg-blue-500/10' },
  arándano: { emoji: '🫐', color: 'border-blue-500 bg-blue-500/10' },
  piña: { emoji: '🍍', color: 'border-yellow-500 bg-yellow-500/10' },
  pina: { emoji: '🍍', color: 'border-yellow-500 bg-yellow-500/10' },
  parchita: { emoji: '🍈', color: 'border-yellow-600 bg-yellow-600/10' },
  maracuya: { emoji: '🍈', color: 'border-yellow-600 bg-yellow-600/10' },
  limon: { emoji: '🍋', color: 'border-green-400 bg-green-400/10' },
  limón: { emoji: '🍋', color: 'border-green-400 bg-green-400/10' },
  mora: { emoji: '🍇', color: 'border-purple-600 bg-purple-600/10' }
};

function getFlavorMeta(sabor = '') {
  const key = sabor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(' ')[0];
  return FLAVOR_META[key] || FLAVOR_META.default;
}

export default function RealizarPedido() {
  // ── Estado de la UI ──────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clientName, setClientName] = useState('');

  // Selección temporal (en proceso de añadir al carrito)
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentPresentation, setCurrentPresentation] = useState(null);

  // Carrito de compras
  const [cart, setCart] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  
  // BCV Rate
  const [bcvRate, setBcvRate] = useState(null);

  // ── Datos del inventario ─────────────────────────────────────────
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sabores únicos y presentaciones
  const saboresUnicos = [...new Map(inventario.map(i => [i.sabor, i])).values()];

  // Filtrar presentaciones y ordenar por precio (asumiendo que más precio = mayor tamaño)
  const presentacionesFiltradas = currentProduct
    ? inventario
      .filter(i => i.sabor === currentProduct.sabor && i.stock > 0)
      .sort((a, b) => a.precio - b.precio)
    : [];

  // ── GET: cargar inventario al montar ─────────────────────────────
  useEffect(() => {
    async function fetchInventario() {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .gt('stock', 0) // solo productos con stock
        .order('sabor');

      if (error) {
        console.error('Error cargando inventario:', error.message);
        setError('No se pudo cargar el menú. Inténtalo de nuevo.');
      } else {
        setInventario(data || []);
      }
      setLoading(false);
    }
    fetchInventario();
  }, []);

  // ── GET: Tasa BCV ────────────────────────────────────────────────
  useEffect(() => {
    async function fetchBCV() {
      try {
        const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await res.json();
        if (data && data.promedio) {
          setBcvRate(data.promedio);
        }
      } catch (err) {
        console.error('Error obteniendo tasa BCV:', err);
      }
    }
    fetchBCV();
  }, []);

  // ── Lógica del Carrito ───────────────────────────────────────────
  const handleSelectSabor = (producto) => {
    setCurrentProduct(producto);
    setCurrentPresentation(null); // Resetear presentación al cambiar sabor
    setError(null);
  };

  const addToCart = () => {
    if (!currentPresentation) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === currentPresentation.id);
      if (existing) {
        // Validar contra el stock máximo de la base de datos
        if (existing.cantidad >= currentPresentation.stock) {
          setError(`Solo hay ${currentPresentation.stock} disponibles de este producto.`);
          return prev;
        }
        return prev.map(item =>
          item.id === currentPresentation.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { ...currentPresentation, cantidad: 1 }];
    });

    // Limpiar selección actual para invitar a seleccionar más
    setCurrentProduct(null);
    setCurrentPresentation(null);
    setError(null);
  };

  const updateCartQuantity = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.cantidad + delta;
          if (newQty > 0 && newQty <= item.stock) {
            return { ...item, cantidad: newQty };
          }
        }
        return item;
      });
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  // ── POST: crear pedido ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!clientName.trim()) {
      setError('Por favor ingresa tu nombre antes de continuar.');
      return;
    }
    if (cart.length === 0) {
      setError('Tu carrito está vacío. Agrega al menos un yogurt.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Insertar el pedido principal
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          cliente_nombre: clientName.trim(),
          total: cartTotal,
          estado: 'Pendiente por Pago',
        })
        .select('id')
        .single();

      if (pedidoError) throw pedidoError;

      const pedidoId = pedidoData.id;

      // 2. Inserción masiva de los detalles del pedido
      const detalles = cart.map(item => ({
        pedido_id: pedidoId,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
      }));

      const { error: detalleError } = await supabase
        .from('detalles_pedido')
        .insert(detalles);

      if (detalleError) throw detalleError;

      // ¡Éxito!
      setDone(true);
      setClientName('');
      setCart([]);
      setTimeout(() => {
        setDone(false);
        setSubmitting(false);
      }, 2500);
    } catch (err) {
      console.error('Error al realizar el pedido:', err.message);
      setError(`No se pudo procesar el pedido: ${err.message}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Top AppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container border-b border-outline-variant flex justify-between items-center px-4 h-16">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-highest transition-colors p-2 rounded-full active:scale-95 duration-150"
          >
            menu
          </button>
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="THÖRGURT Logo" className="w-8 h-8 object-contain drop-shadow-md" />
            <h1 className="font-bold text-xl text-primary tracking-tight">THÖRGURT</h1>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-surface border-r border-outline-variant z-[70] transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="THÖRGURT Logo" className="w-8 h-8 object-contain" />
            <h2 className="font-bold text-xl text-primary tracking-tight">Menú</h2>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="p-4 flex flex-col gap-2">
          <a href="/" className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 text-primary font-bold border border-primary/20">
            <span className="material-symbols-outlined">icecream</span>
            Realizar Pedido
          </a>
          <a href="/pago" className="flex items-center gap-3 p-4 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors font-medium">
            <span className="material-symbols-outlined">receipt_long</span>
            Reportar Pago
          </a>
          <div className="my-4 border-t border-outline-variant"></div>
          <a href="/login" className="flex items-center gap-3 p-4 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors font-medium">
            <span className="material-symbols-outlined">admin_panel_settings</span>
            Acceso Privado
          </a>
        </nav>
      </aside>

      <main className="pt-20 pb-40 px-5 max-w-lg mx-auto">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-primary/20 to-surface-container rounded-[2rem] p-8 mb-6 border border-primary/20 text-center shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden">
            {/* Decorative blurs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-xs font-extrabold mb-4 inline-block uppercase tracking-widest shadow-md">
                ¡BIENVENIDO A THÖRGURT!
              </span>
              <h2 className="font-extrabold text-3xl text-white mb-3 tracking-tight">
                El mejor yogurt<br/>de la ciudad 🍦
              </h2>
              <p className="text-on-surface-variant text-sm max-w-[280px] mx-auto leading-relaxed">
                Selecciona tus sabores favoritos, elige el tamaño perfecto y disfruta de una experiencia refrescante.
              </p>
              {bcvRate && (
                <div className="mt-4 inline-flex items-center gap-2 bg-surface/50 border border-outline-variant/30 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">payments</span>
                  <span className="text-[11px] font-medium text-on-surface-variant">
                    Tasa BCV hoy: <strong className="text-on-surface">{bcvRate.toFixed(2)} Bs</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Error global */}
        {error && (
          <div className="mb-6 p-4 bg-error-container/30 border border-error/40 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-error">error</span>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Formulario de cliente y selección */}
        <div className="space-y-8">
          {/* Customer Name */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-on-surface-variant block ml-1">
              Nombre del Cliente
            </label>
            <input
              className="w-full bg-surface-container-low border-2 border-outline-variant rounded-xl px-4 py-4 focus:border-primary focus:outline-none transition-all text-on-surface placeholder:text-on-surface-variant/50 text-base"
              placeholder="¿A quién saludamos hoy?"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              form="orderForm"
            />
          </div>

          {/* Flavor Selection */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-on-surface-variant block ml-1">
              Elige tu Sabor
            </label>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-24 bg-surface-container-low rounded-xl animate-pulse border border-outline-variant" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {saboresUnicos.map((producto) => {
                  const meta = getFlavorMeta(producto.sabor);
                  const isSelected = currentProduct?.sabor === producto.sabor;
                  return (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => handleSelectSabor(producto)}
                      className={`border p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${isSelected
                          ? `${meta.color} scale-105 shadow-md`
                          : 'bg-surface-container border-outline-variant hover:bg-surface-container-highest'
                        }`}
                    >
                      <span className="text-3xl filter drop-shadow-sm">
                        {meta.emoji}
                      </span>
                      <span className="text-sm font-medium text-on-surface">{producto.sabor}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Presentation / Size Selection */}
          {currentProduct && presentacionesFiltradas.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="text-sm font-medium text-on-surface-variant block ml-1">
                Presentación
              </label>
              <div className="flex gap-2 flex-wrap">
                {presentacionesFiltradas.map((item) => {
                  // Calcular cuánto de este ítem ya está en el carrito
                  const inCart = cart.find(c => c.id === item.id)?.cantidad || 0;
                  const available = item.stock - inCart;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={available <= 0}
                      onClick={() => setCurrentPresentation(item)}
                      className={`flex-1 min-w-[80px] py-3 px-2 rounded-lg text-center flex flex-col items-center justify-center gap-1 transition-all border ${currentPresentation?.id === item.id
                          ? 'bg-primary text-on-primary border-primary'
                          : available <= 0
                            ? 'bg-surface-container-lowest border-outline-variant text-on-surface-variant/50 opacity-50 cursor-not-allowed'
                            : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-highest'
                        }`}
                    >
                      <span className="text-sm font-bold">{item.presentacion}</span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${currentPresentation?.id === item.id
                          ? 'text-on-primary/80'
                          : available <= 0 ? 'text-error' : 'text-primary'
                        }`}>
                        {available <= 0 ? 'Agotado' : `${available} Disp.`}
                      </span>
                      <span className="text-xs mt-1 opacity-80">${Number(item.precio).toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>

              {currentPresentation && (
                <button
                  type="button"
                  onClick={addToCart}
                  className="w-full py-4 bg-primary text-on-primary shadow-[0_8px_20px_rgba(76,215,246,0.3)] rounded-xl font-extrabold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all mt-6 hover:brightness-110"
                >
                  <span className="material-symbols-outlined text-2xl">add_shopping_cart</span>
                  Añadir al Carrito
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sección del Carrito */}
        {cart.length > 0 && (
          <div className="mt-12 bg-surface-container rounded-2xl border border-outline-variant overflow-hidden">
            <div className="bg-surface-container-high px-4 py-3 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">shopping_cart</span>
              <h3 className="font-bold text-on-surface">Tu Pedido</h3>
              <span className="ml-auto bg-primary text-on-primary text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.cantidad, 0)} items
              </span>
            </div>

            <ul className="divide-y divide-outline-variant">
              {cart.map(item => (
                <li key={item.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface text-sm">
                      {item.sabor} <span className="text-on-surface-variant font-normal">({item.presentacion})</span>
                    </p>
                    <p className="text-primary text-xs font-bold mt-1">
                      ${Number(item.precio).toFixed(2)} c/u
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-surface-container-highest rounded-lg p-1 border border-outline-variant">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-surface hover:bg-surface-container text-on-surface active:scale-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">remove</span>
                    </button>
                    <span className="text-sm font-bold w-4 text-center tabular-nums">{item.cantidad}</span>
                    <button
                      type="button"
                      disabled={item.cantidad >= item.stock}
                      onClick={() => updateCartQuantity(item.id, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-surface hover:bg-surface-container text-on-surface active:scale-90 transition-all disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-error hover:bg-error-container active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="p-4 bg-surface-container-high flex justify-between items-center border-t border-outline-variant">
              <span className="text-on-surface-variant font-medium">Total a pagar:</span>
              <div className="text-right">
                <div className="text-2xl font-extrabold text-primary leading-none">
                  ${cartTotal.toFixed(2)}
                </div>
                {bcvRate && (
                  <div className="text-sm font-medium text-on-surface-variant mt-1">
                    ~ {(cartTotal * bcvRate).toFixed(2)} Bs
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Sticky Bottom Button - form action */}
      <form id="orderForm" onSubmit={handleSubmit} className="fixed bottom-0 left-0 w-full p-4 bg-surface/80 backdrop-blur-xl border-t border-outline-variant z-50">
        <button
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-150 flex items-center justify-center gap-3 ${done
              ? 'bg-green-500 text-white'
              : submitting || cart.length === 0
                ? 'bg-primary/50 text-on-primary/50 cursor-not-allowed'
                : 'bg-primary text-on-primary active:scale-95 shadow-[0_8px_30px_rgba(76,215,246,0.2)]'
            }`}
          type="submit"
          disabled={submitting || done || cart.length === 0}
        >
          {submitting && !done && (
            <>
              <span className="material-symbols-outlined animate-spin">sync</span>
              Procesando...
            </>
          )}
          {done && (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              ¡Pedido enviado!
            </>
          )}
          {!submitting && !done && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                Confirmar Pedido (${cartTotal.toFixed(2)})
                <span className="material-symbols-outlined text-xl">send</span>
              </div>
              {bcvRate && (
                <span className="text-[10px] font-normal opacity-80 uppercase tracking-widest mt-0.5">
                  {(cartTotal * bcvRate).toFixed(2)} Bs
                </span>
              )}
            </div>
          )}
        </button>
      </form>
    </div>
  );
}
