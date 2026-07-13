import React, { useState } from 'react';

export default function ReportarPago() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [copied, setCopied] = useState('');
  const [fileName, setFileName] = useState('');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  const orders = [
    { id: 'ORD-9928', amount: '$24.50', date: '12 Oct, 2023' },
    { id: 'ORD-9931', amount: '$12.00', date: 'Ayer, 4:20 PM' },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-4 h-16 border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary">menu</span>
          <h1 className="font-bold text-xl text-primary tracking-tight">SmartYogu</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant">
          <span className="material-symbols-outlined text-primary">account_circle</span>
        </div>
      </header>

      <main className="pt-20 pb-24 px-5 max-w-lg mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <h2 className="font-bold text-2xl text-on-surface mb-1">Pagos Pendientes</h2>
          <p className="text-on-surface-variant text-sm font-medium">Gestiona tus facturas y confirma tus transferencias.</p>
        </div>

        {/* Orders List */}
        <div className="space-y-4 mb-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col gap-2 ${
                selectedOrder === order.id
                  ? 'border-primary bg-primary/10'
                  : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'
              }`}
              onClick={() => setSelectedOrder(order.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-primary text-xs font-bold uppercase tracking-widest">PEDIDO #{order.id}</span>
                  <h3 className="font-semibold text-2xl text-on-surface mt-1">{order.amount}</h3>
                </div>
                <span className="px-2 py-1 rounded bg-error-container text-error text-[10px] font-bold uppercase tracking-tighter">PENDIENTE</span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span>{order.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Flow Section */}
        {selectedOrder && (
          <div className="space-y-8 animate-in fade-in">
            {/* Bank Details */}
            <div className="bg-surface-container p-6 rounded-xl border border-primary/20">
              <h4 className="text-primary text-xs font-bold mb-4 uppercase tracking-widest">Datos para Pago Móvil</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                  <span className="text-on-surface-variant text-sm font-medium">Banco</span>
                  <span className="text-on-surface font-bold">Mercantil (0105)</span>
                </div>
                <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                  <span className="text-on-surface-variant text-sm font-medium">Cédula</span>
                  <div className="flex items-center gap-1">
                    <span className="text-on-surface font-bold">V-27.455.102</span>
                    <button
                      className={`transition-all active:scale-90 ${copied === '27455102' ? 'text-green-400' : 'text-primary'}`}
                      onClick={() => copyToClipboard('27455102')}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {copied === '27455102' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm font-medium">Teléfono</span>
                  <div className="flex items-center gap-1">
                    <span className="text-on-surface font-bold">0412-555-8922</span>
                    <button
                      className={`transition-all active:scale-90 ${copied === '04125558922' ? 'text-green-400' : 'text-primary'}`}
                      onClick={() => copyToClipboard('04125558922')}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {copied === '04125558922' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="space-y-4">
              <h4 className="text-on-surface text-xs font-bold uppercase tracking-widest">Subir Comprobante</h4>
              <label
                className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer active:scale-[0.98]"
                htmlFor="file-input"
              >
                <input
                  accept="image/*,application/pdf"
                  className="hidden"
                  id="file-input"
                  type="file"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                />
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                  <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
                </div>
                <p className="text-on-surface text-sm font-medium text-center">Toca para capturar o subir imagen</p>
                <p className="text-on-surface-variant text-[12px] text-center">JPG, PNG o PDF (Máx 5MB)</p>
              </label>

              {fileName && (
                <div className="flex items-center justify-between p-4 bg-surface-container-highest rounded-lg border border-primary/30">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">image</span>
                    <span className="text-on-surface text-sm truncate max-w-[150px]">{fileName}</span>
                  </div>
                  <button className="text-error" onClick={() => setFileName('')}>
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                  </button>
                </div>
              )}

              {/* Main Action Button */}
              <button
                className={`w-full h-14 font-bold rounded-xl flex items-center justify-center gap-2 duration-150 transition-all ${
                  fileName
                    ? 'bg-primary text-on-primary active:scale-95 cursor-pointer'
                    : 'bg-primary/50 text-on-primary/50 cursor-not-allowed'
                }`}
                disabled={!fileName}
              >
                <span>Enviar Comprobante</span>
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface border-t border-outline-variant shadow-lg">
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-90 duration-200" href="#">
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="text-[11px] font-semibold">Order</span>
        </a>
        <a className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 active:scale-90 duration-200" href="#">
          <span className="material-symbols-outlined">account_balance_wallet</span>
          <span className="text-[11px] font-semibold">Payments</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-90 duration-200" href="#">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="text-[11px] font-semibold">Status</span>
        </a>
      </nav>
    </div>
  );
}
