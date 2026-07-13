import React, { useState } from 'react';

export default function Administracion() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      {/* NavigationDrawer Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* NavigationDrawer */}
      <aside 
        className={`fixed left-0 top-0 h-full w-60 bg-surface-container-low border-r border-outline-variant flex flex-col z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`} 
        style={{ padding: '24px 0' }}
      >
        <div className="px-4 mb-8">
          <h1 className="text-primary tracking-tight font-bold text-2xl">SmartYogu Admin</h1>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          <a className="flex items-center gap-4 px-4 py-2 text-primary font-bold border-r-4 border-primary bg-surface-container-high transition-colors duration-200 rounded-l-lg" href="#">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="text-sm font-medium">Dashboard</span>
          </a>
          <a className="flex items-center gap-4 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="text-sm font-medium">Inventory</span>
          </a>
          <a className="flex items-center gap-4 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined">verified_user</span>
            <span className="text-sm font-medium">Verification</span>
          </a>
          <a className="flex items-center gap-4 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-medium">Settings</span>
          </a>
        </nav>
        <div className="mt-auto px-4 pt-6 border-t border-outline-variant">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              AD
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface">Admin Root</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Master Access</p>
            </div>
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
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-surface-container px-4 py-1 rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-on-surface-variant text-sm mr-1">search</span>
              <input className="bg-transparent border-none focus:outline-none text-sm text-on-surface w-48" placeholder="Buscar pedido o sabor..." type="text" />
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-primary text-xl">account_circle</span>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-[1440px] mx-auto">
          {/* Hero Stats */}
          <section className="relative h-48 rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant">
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-transparent to-transparent"></div>
            <div className="relative z-10 p-6 flex flex-col justify-end h-full">
              <p className="text-primary font-bold text-xs uppercase tracking-tighter mb-1">Resumen Operativo</p>
              <h1 className="font-extrabold text-5xl text-on-surface leading-none">Freshness Dashboard</h1>
            </div>
          </section>

          {/* Section 1: Inventory */}
          <section id="inventory">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="font-semibold text-2xl text-on-surface">Inventario de Sabores</h3>
                <p className="text-on-surface-variant text-sm font-medium">Gestión de stock en tiempo real</p>
              </div>
              <button className="bg-primary text-on-primary px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 active:scale-95 transition-all shadow-lg hover:brightness-110">
                <span className="material-symbols-outlined">add</span>
                Añadir Sabor
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[
                { name: 'Arándanos Silvestres', tag: 'Premium', tagClass: 'bg-primary/10 text-primary border-primary/20', icon: 'icecream', stock: 124, size: '500ml / 1L', level: '75%', levelColor: 'bg-primary' },
                { name: 'Mango Tropical', tag: 'Trending', tagClass: 'bg-tertiary/10 text-tertiary border-tertiary/20', icon: 'nutrition', stock: 42, size: '350ml / 500ml', level: '20%', levelColor: 'bg-error' },
                { name: 'Natural Stevia', tag: 'Essential', tagClass: 'bg-on-surface-variant/10 text-on-surface-variant border-outline-variant', icon: 'eco', stock: 89, size: '500ml / 1.5L', level: '55%', levelColor: 'bg-primary' },
                { name: 'Coco Cremoso', tag: 'Vegan', tagClass: 'bg-primary/10 text-primary border-primary/20', icon: 'spa', stock: 210, size: '500ml', level: '90%', levelColor: 'bg-primary' },
              ].map((item) => (
                <div key={item.name} className="bento-card bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-lg text-primary">{item.name}</h4>
                      <span className={`inline-flex items-center px-2 py-[2px] text-[10px] rounded-full border uppercase font-bold tracking-widest ${item.tagClass}`}>{item.tag}</span>
                    </div>
                    <div className="bg-surface-container-highest p-1 rounded-lg">
                      <span className="material-symbols-outlined text-on-surface-variant">{item.icon}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 my-8">
                    <div className="flex-1">
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">Stock Disponible</p>
                      <div className="text-[56px] font-extrabold text-on-surface leading-none tabular-nums tracking-tighter">{item.stock}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button className="w-10 h-10 flex items-center justify-center bg-surface-container-highest rounded-lg text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-90 border border-outline-variant">
                        <span className="material-symbols-outlined">add</span>
                      </button>
                      <button className="w-10 h-10 flex items-center justify-center bg-surface-container-highest rounded-lg text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-90 border border-outline-variant">
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-outline-variant flex justify-between items-center">
                    <span className="text-xs text-on-surface-variant">Tamaño: <span className="text-on-surface">{item.size}</span></span>
                    <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={`h-full ${item.levelColor}`} style={{ width: item.level }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Verification Queue */}
          <section id="verification">
            <div className="mb-6">
              <h3 className="font-semibold text-2xl text-on-surface">Cola de Verificación</h3>
              <p className="text-on-surface-variant text-sm font-medium">Validación manual de pagos y comprobantes bancarios</p>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant">
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Monto</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Fecha / Hora</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Comprobante</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {[
                    { initials: 'RM', name: 'Ricardo Martínez', id: 'ORD-9821', amount: '$45.50', time: 'Hoy, 14:32' },
                    { initials: 'LC', name: 'Laura Castro', id: 'ORD-9820', amount: '$120.00', time: 'Hoy, 13:15' },
                    { initials: 'SP', name: 'Samuel Peña', id: 'ORD-9819', amount: '$24.99', time: 'Hoy, 12:45' },
                  ].map((row) => (
                    <tr key={row.id} className="hover:bg-surface-container-highest transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">{row.initials}</div>
                          <div>
                            <p className="text-sm font-medium text-on-surface">{row.name}</p>
                            <p className="text-xs text-on-surface-variant">ID: #{row.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-primary">{row.amount}</td>
                      <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{row.time}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 bg-surface-container-highest border border-outline-variant rounded text-xs text-primary hover:bg-primary hover:text-on-primary transition-all"
                          onClick={() => setModalOpen(true)}
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          Ver PDF
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium hover:bg-green-500 hover:text-white transition-all">Aprobar</button>
                          <button className="px-4 py-2 bg-error/20 text-error border border-error/30 rounded-lg text-xs font-medium hover:bg-error hover:text-on-error transition-all">Rechazar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 text-on-surface-variant flex justify-between items-center bg-surface-container-lowest">
          <p className="text-xs">© 2024 SmartYogu Ecosystem. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> System Online
            </span>
            <span className="text-xs">v2.4.0-Fresh</span>
          </div>
        </footer>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-semibold text-xl text-on-surface">Comprobante de Pago</h3>
              <button className="text-on-surface-variant hover:text-primary transition-colors" onClick={() => setModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 bg-surface-container-lowest">
              <div className="w-full aspect-[3/4] bg-surface-container-highest rounded-lg flex items-center justify-center overflow-hidden border border-outline-variant">
                <span className="material-symbols-outlined text-on-surface-variant text-6xl">receipt_long</span>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-4">
              <button className="px-6 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface" onClick={() => setModalOpen(false)}>Cerrar</button>
              <button className="px-8 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium active:scale-95 transition-all">Validar Ahora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
