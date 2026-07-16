import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const BUCKET_NAME = 'comprobantes';

export default function ReportarPago() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // ── Estado General ────────────────────────────────────────────────────
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [copied, setCopied] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [numeroTransaccion, setNumeroTransaccion] = useState('');

  const [bcvRate, setBcvRate] = useState(null);

  // ── Funciones de Utilidad ─────────────────────────────────────────────
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ── GET: pedidos pendientes de pago ──────────────────────────────
  useEffect(() => {
    async function fetchPedidos() {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, cliente_nombre, total, estado, created_at')
        .eq('estado', 'Pendiente por Pago')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando pedidos:', error.message);
        setError('No se pudieron cargar los pedidos.');
      } else {
        setPedidos(data || []);
      }
      setLoading(false);
    }
    fetchPedidos();
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

  // ── Helpers ──────────────────────────────────────────────────────
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
      setError(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileName('');
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ── PATCH: subir comprobante y actualizar pedido ─────────────────
  const handleSubmit = async () => {
    if (!selectedOrder || !file) return;
    if (!numeroTransaccion.trim()) {
      setError('Por favor ingresa el número de transacción.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      let comprobanteUrl = null;

      // 1. Subir archivo a Supabase Storage
      const ext = file.name.split('.').pop();
      const filePath = `pedido_${selectedOrder.id}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Si el bucket no existe, continuar con URL vacía y advertir
        console.warn('No se pudo subir el archivo al Storage:', uploadError.message);
        setError(`Aviso: No se pudo subir la imagen (${uploadError.message}). Se marcará el pedido de todas formas.`);
      } else {
        // Obtener URL pública del archivo
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);
        comprobanteUrl = urlData?.publicUrl || null;
      }

      // 2. PATCH: actualizar pedido
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          estado: 'Pago por Verificar',
          comprobante_url: comprobanteUrl,
          numero_transaccion: numeroTransaccion.trim(),
        })
        .eq('id', selectedOrder.id);

      if (updateError) throw updateError;

      // Éxito: quitar el pedido de la lista local
      setPedidos((prev) => prev.filter((p) => p.id !== selectedOrder.id));
      setSelectedOrder(null);
      setFile(null);
      setFileName('');
      setNumeroTransaccion('');
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error('Error al reportar el pago:', err.message);
      setError(`Error al actualizar el pedido: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-4 h-16 border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="material-symbols-outlined text-primary hover:bg-surface-container-highest transition-colors p-2 rounded-full active:scale-95 duration-150"
          >
            menu
          </button>
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="THÖRGURT Logo" className="w-8 h-8 object-contain drop-shadow-md" />
            <h1 className="font-bold text-xl text-primary tracking-tight">THÖRGURT</h1>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant">
          <span className="material-symbols-outlined text-primary">account_circle</span>
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
          <a href="/" className="flex items-center gap-3 p-4 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors font-medium">
            <span className="material-symbols-outlined">icecream</span>
            Realizar Pedido
          </a>
          <a href="/pago" className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 text-primary font-bold border border-primary/20">
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

      <main className="pt-20 pb-24 px-5 max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="font-bold text-2xl text-on-surface mb-1">Pagos Pendientes</h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Gestiona tus facturas y confirma tus transferencias.
            </p>
          </div>
          {bcvRate && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-tertiary tracking-widest block">Tasa BCV</span>
              <span className="text-sm font-bold text-on-surface">{bcvRate.toFixed(2)} Bs</span>
            </div>
          )}
        </div>

        {/* Buscador de pedidos */}
        <div className="mb-6 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o apellido..."
            className="w-full bg-surface-container-low border-2 border-outline-variant rounded-xl pl-12 pr-4 py-3 focus:border-primary focus:outline-none text-on-surface transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Mensaje de éxito */}
        {done && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 animate-pulse">
            <span className="material-symbols-outlined text-green-400">check_circle</span>
            <p className="text-sm text-green-400 font-medium">
              ¡Comprobante enviado! Tu pago está en revisión.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-error-container/30 border border-error/40 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-error mt-0.5">warning</span>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Skeleton / Lista de pedidos */}
        {searchQuery.trim().length < 3 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant block mb-3">
              search
            </span>
            <p className="text-on-surface-variant text-sm">Ingresa tu nombre y apellido para buscar tus pedidos pendientes.</p>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-24 bg-surface-container-low rounded-xl animate-pulse border border-outline-variant" />
            ))}
          </div>
        ) : pedidos.filter(p => p.cliente_nombre?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && !done ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant block mb-3">
              task_alt
            </span>
            <p className="text-on-surface-variant text-sm">No tienes pedidos pendientes por pagar.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {pedidos
              .filter(p => p.cliente_nombre?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((order) => (
                <div
                  key={order.id}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col gap-2 ${selectedOrder?.id === order.id
                    ? 'border-primary bg-primary/10'
                    : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'
                    }`}
                  onClick={() => { setSelectedOrder(order); setError(null); }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-primary text-xs font-bold uppercase tracking-widest">
                        PEDIDO #{order.id.toString().slice(-6).toUpperCase()}
                      </span>
                      <h3 className="font-semibold text-2xl text-on-surface mt-1 leading-none">
                        ${Number(order.total).toFixed(2)}
                      </h3>
                      {bcvRate && (
                        <p className="text-sm font-medium text-on-surface-variant mt-0.5">
                          ~ {(Number(order.total) * bcvRate).toFixed(2)} Bs
                        </p>
                      )}
                      <p className="text-xs text-on-surface-variant mt-1 font-medium bg-surface-container w-fit px-2 py-0.5 rounded">
                        {order.cliente_nombre}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded bg-error-container text-error text-[10px] font-bold uppercase tracking-tighter">
                      PENDIENTE
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-on-surface-variant text-sm">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Payment Flow — visible al seleccionar un pedido */}
        {selectedOrder && (
          <div className="space-y-8">
            {/* Bank Details */}
            <div className="bg-surface-container p-6 rounded-xl border border-primary/20">
              <h4 className="text-primary text-xs font-bold mb-4 uppercase tracking-widest">
                Datos para Pago Móvil
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <span className="text-on-surface-variant text-sm font-medium">Banco</span>
                  <span className="text-on-surface font-bold">Mercantil (0105)</span>
                </div>
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <span className="text-on-surface-variant text-sm font-medium">Cédula</span>
                  <div className="flex items-center gap-2">
                    <span className="text-on-surface font-bold">V-29.863.496</span>
                    <button
                      className={`transition-all active:scale-90 ${copied === '29863496' ? 'text-green-400' : 'text-primary'
                        }`}
                      onClick={() => copyToClipboard('29863496')}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {copied === '29863496' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <span className="text-on-surface-variant text-sm font-medium">Teléfono</span>
                  <div className="flex items-center gap-2">
                    <span className="text-on-surface font-bold">0414-315-6352</span>
                    <button
                      className={`transition-all active:scale-90 ${copied === '04143156352' ? 'text-green-400' : 'text-primary'
                        }`}
                      onClick={() => copyToClipboard('04143156352')}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {copied === '04143156352' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm font-medium">Monto exacto</span>
                  <div className="text-right leading-tight">
                    <span className="text-primary font-bold text-lg block">
                      ${Number(selectedOrder.total).toFixed(2)}
                    </span>
                    {bcvRate && (
                      <span className="text-on-surface-variant font-medium text-sm">
                        ~ {(Number(selectedOrder.total) * bcvRate).toFixed(2)} Bs
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Número de transacción */}
            <div className="space-y-2">
              <h4 className="text-on-surface text-xs font-bold uppercase tracking-widest">Número de Transacción</h4>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">tag</span>
                <input
                  type="text"
                  placeholder="Ej: 1234567890"
                  className="w-full bg-surface-container-low border-2 border-outline-variant rounded-xl pl-12 pr-4 py-3 focus:border-primary focus:outline-none text-on-surface transition-colors"
                  value={numeroTransaccion}
                  onChange={(e) => setNumeroTransaccion(e.target.value)}
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <h4 className="text-on-surface text-xs font-bold uppercase tracking-widest">
                Subir Comprobante
              </h4>
              <label
                className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer active:scale-[0.98]"
                htmlFor="file-input"
              >
                <input
                  accept="image/*,application/pdf"
                  className="hidden"
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                />
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                  <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
                </div>
                <p className="text-on-surface text-sm font-medium text-center">
                  Toca para capturar o subir imagen
                </p>
                <p className="text-on-surface-variant text-[12px] text-center">
                  JPG, PNG o PDF (Máx 5MB)
                </p>
              </label>

              {fileName && (
                <div className="flex items-center justify-between p-4 bg-surface-container-highest rounded-lg border border-primary/30">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">image</span>
                    <span className="text-on-surface text-sm truncate max-w-[200px]">{fileName}</span>
                  </div>
                  <button className="text-error hover:scale-110 transition-transform" onClick={removeFile}>
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                className={`w-full h-14 font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-150 ${file && numeroTransaccion.trim() && !submitting
                  ? 'bg-primary text-on-primary active:scale-95 cursor-pointer'
                  : submitting
                    ? 'bg-primary/70 text-on-primary cursor-not-allowed'
                    : 'bg-primary/30 text-on-surface/30 cursor-not-allowed'
                  }`}
                disabled={!file || !numeroTransaccion.trim() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span>Enviar Comprobante</span>
                    <span className="material-symbols-outlined">send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
