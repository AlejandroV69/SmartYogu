import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { sendTelegramPhoto } from '../telegramBot';

export default function ReportarPago() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bcvRate, setBcvRate] = useState(null);
  const [copied, setCopied] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    referencia: '',
    monto: '',
  });

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  // ── Configuración Dinámica de Pago Móvil ───────────────────────
  const [pagoMovilConfig, setPagoMovilConfig] = useState({
    banco: 'Mercantil (0105)',
    cedula: 'V-29.863.496',
    telefono: '0414-315-6352'
  });

  useEffect(() => {
    function loadConfig() {
      const saved = localStorage.getItem('smartyogu_pagomovil_config');
      if (saved) {
        setPagoMovilConfig(JSON.parse(saved));
      }
    }
    loadConfig();

    // Escuchar actualizaciones desde el panel admin en otras pestañas
    window.addEventListener('storage', loadConfig);
    return () => window.removeEventListener('storage', loadConfig);
  }, []);

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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  // Función auxiliar para comprimir la imagen en el cliente antes de subir
  const compressImage = (fileInstance) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileInstance);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000; // Limitar ancho para que pese poquísimo
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a blob JPEG con calidad reducida (70%)
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], fileInstance.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(fileInstance); // fallback
            }
          }, 'image/jpeg', 0.7);
        };
        img.onerror = () => resolve(fileInstance);
      };
      reader.onerror = () => resolve(fileInstance);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor sube la foto del comprobante.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      // 0. Comprimir imagen en el cliente para subida ultra rápida
      const fileToUpload = await compressImage(file);

      let comprobanteUrl = null;

      // 1. Subir archivo a Supabase Storage
      const ext = fileToUpload.name.split('.').pop();
      const filePath = `reporte_directo_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('comprobantes')
        .upload(filePath, fileToUpload, { upsert: true });

      if (uploadError) {
        console.warn('No se pudo subir el archivo al Storage:', uploadError.message);
        throw new Error('Error al subir la imagen a la base de datos.');
      } else {
        const { data: urlData } = supabase.storage
          .from('comprobantes')
          .getPublicUrl(filePath);
        comprobanteUrl = urlData?.publicUrl || null;
      }

      // 2. Insertar en tabla pedidos para que se vea en el Admin
      const { error: insertError } = await supabase
        .from('pedidos')
        .insert([{
          cliente_nombre: formData.nombre,
          cedula: formData.cedula,
          telefono: formData.telefono,
          numero_transaccion: formData.referencia,
          total: parseFloat(formData.monto),
          estado: 'Pago por Verificar',
          comprobante_url: comprobanteUrl,
          tipo_entrega: 'Reporte Directo',
          direccion_envio: 'N/A (Pago Directo)'
        }]);

      if (insertError) {
        throw new Error(`Error registrando el pago en el sistema: ${insertError.message}`);
      }

      // 3. Notificar a Telegram con la foto comprimida
      const caption = `💸 <b>¡NUEVO REPORTE DE PAGO!</b>\n\n` +
        `👤 <b>Cliente:</b> ${formData.nombre}\n` +
        `🪪 <b>Cédula/RIF:</b> ${formData.cedula}\n` +
        `📱 <b>Teléfono:</b> ${formData.telefono}\n` +
        `💳 <b>Ref. Pago:</b> ${formData.referencia}\n` +
        `💰 <b>Monto:</b> $${formData.monto}\n`;

      await sendTelegramPhoto(fileToUpload, caption);
      
      setDone(true);
      setFormData({ nombre: '', cedula: '', telefono: '', referencia: '', monto: '' });
      setFile(null);
      setFileName('');
      
      setTimeout(() => setDone(false), 5000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al enviar el reporte. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = formData.nombre && formData.cedula && formData.telefono && formData.referencia && formData.monto && file;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-4 h-16 border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <button
            type="button"
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
          <button type="button" onClick={() => setSidebarOpen(false)} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="p-4 flex flex-col gap-2">
          <a href="/" className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 text-primary font-bold border border-primary/20">
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
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="font-bold text-2xl text-on-surface mb-1">Reportar Pago</h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Envía tu comprobante para procesar tu pedido.
            </p>
          </div>
          {bcvRate && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-tertiary tracking-widest block">Tasa BCV</span>
              <span className="text-sm font-bold text-on-surface">{bcvRate.toFixed(2)} Bs</span>
            </div>
          )}
        </div>

        {done && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 animate-pulse">
            <span className="material-symbols-outlined text-green-400">check_circle</span>
            <p className="text-sm text-green-400 font-medium">
              ¡Reporte enviado con éxito! En breve procesamos tu pedido.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-error-container/30 border border-error/40 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-error mt-0.5">warning</span>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bank Details */}
          <div className="bg-surface-container p-6 rounded-xl border border-primary/20">
            <h4 className="text-primary text-xs font-bold mb-4 uppercase tracking-widest">
              Datos para Pago Móvil
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                <span className="text-on-surface-variant text-sm font-medium">Banco</span>
                <span className="text-on-surface font-bold">{pagoMovilConfig.banco}</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                <span className="text-on-surface-variant text-sm font-medium">Cédula</span>
                <div className="flex items-center gap-2">
                  <span className="text-on-surface font-bold">{pagoMovilConfig.cedula}</span>
                  <button
                    type="button"
                    className={`transition-all active:scale-90 ${copied === pagoMovilConfig.cedula.replace(/\D/g, '') ? 'text-green-400' : 'text-primary'}`}
                    onClick={() => copyToClipboard(pagoMovilConfig.cedula.replace(/\D/g, ''))}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copied === pagoMovilConfig.cedula.replace(/\D/g, '') ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant text-sm font-medium">Teléfono</span>
                <div className="flex items-center gap-2">
                  <span className="text-on-surface font-bold">{pagoMovilConfig.telefono}</span>
                  <button
                    type="button"
                    className={`transition-all active:scale-90 ${copied === pagoMovilConfig.telefono.replace(/\D/g, '') ? 'text-green-400' : 'text-primary'}`}
                    onClick={() => copyToClipboard(pagoMovilConfig.telefono.replace(/\D/g, ''))}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copied === pagoMovilConfig.telefono.replace(/\D/g, '') ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-on-surface text-xs font-bold uppercase tracking-widest mb-1 block">Nombre y Apellido</label>
              <input
                type="text"
                name="nombre"
                required
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:outline-none text-on-surface transition-colors"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="text-on-surface text-xs font-bold uppercase tracking-widest mb-1 block">Cédula / RIF</label>
              <input
                type="text"
                name="cedula"
                required
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:outline-none text-on-surface transition-colors"
                value={formData.cedula}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-on-surface text-xs font-bold uppercase tracking-widest mb-1 block">Teléfono de contacto</label>
              <input
                type="tel"
                name="telefono"
                required
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:outline-none text-on-surface transition-colors"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-on-surface text-xs font-bold uppercase tracking-widest mb-1 block">Número de Referencia</label>
              <input
                type="text"
                name="referencia"
                required
                placeholder="Últimos dígitos"
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:outline-none text-on-surface transition-colors"
                value={formData.referencia}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-on-surface text-xs font-bold uppercase tracking-widest mb-1 block">Monto (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  name="monto"
                  required
                  className="w-full bg-surface-container-low border-2 border-outline-variant rounded-xl pl-10 pr-4 py-3 focus:border-primary focus:outline-none text-on-surface transition-colors"
                  value={formData.monto}
                  onChange={handleChange}
                />
              </div>
              {formData.monto && bcvRate && (
                <p className="text-sm font-medium text-on-surface-variant mt-1 text-right">
                  ~ {(Number(formData.monto) * bcvRate).toFixed(2)} Bs
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-on-surface text-xs font-bold uppercase tracking-widest mt-6">
              Foto del Comprobante
            </h4>
            <label
              className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer active:scale-[0.98]"
              htmlFor="file-input"
            >
              <input
                accept="image/*"
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
                Solo imágenes (JPG, PNG)
              </p>
            </label>

            {fileName && (
              <div className="flex flex-col gap-2 p-4 bg-surface-container-highest rounded-lg border border-primary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">image</span>
                    <span className="text-on-surface text-sm truncate max-w-[200px]">{fileName}</span>
                  </div>
                  <button type="button" className="text-error hover:scale-110 transition-transform" onClick={removeFile}>
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                  </button>
                </div>
                {file && (
                  <div className="relative mt-2 rounded-lg overflow-hidden border border-outline-variant aspect-video bg-black/20 flex items-center justify-center">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Vista previa" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid || submitting}
            className={`w-full h-14 font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-150 ${isFormValid && !submitting
              ? 'bg-primary text-on-primary active:scale-95 cursor-pointer'
              : 'bg-primary/30 text-on-surface/30 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Enviando...
              </>
            ) : (
              <>
                <span>Enviar Reporte</span>
                <span className="material-symbols-outlined">send</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
