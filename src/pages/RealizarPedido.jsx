import React, { useState } from 'react';

export default function RealizarPedido() {
  const [flavor, setFlavor] = useState('fresa');
  const [size, setSize] = useState('pequeno');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setDone(true);
      setTimeout(() => {
        setSubmitting(false);
        setDone(false);
      }, 2000);
    }, 1500);
  };

  const flavors = [
    { id: 'fresa', icon: 'fiber_manual_record', label: 'Fresa', color: 'text-primary' },
    { id: 'melocoton', icon: 'restaurant_menu', label: 'Melocotón', color: 'text-tertiary' },
    { id: 'natural', icon: 'cloud', label: 'Natural', color: 'text-on-surface-variant' },
    { id: 'mix', icon: 'auto_awesome', label: 'Mix', color: 'text-secondary' },
  ];

  const sizes = [
    { id: 'pequeno', label: 'Pequeño' },
    { id: 'mediano', label: 'Mediano' },
    { id: 'grande', label: 'Grande' },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Top AppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container border-b border-outline-variant flex justify-between items-center px-4 h-16">
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-highest transition-colors p-2 rounded-full active:scale-95 duration-150">
            menu
          </button>
          <h1 className="font-bold text-xl text-primary tracking-tight">SmartYogu</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-bold">
          UP
        </div>
      </header>

      <main className="pt-20 pb-32 px-5 max-w-lg mx-auto">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="relative h-48 rounded-xl overflow-hidden mb-6 border border-white/5">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-surface to-transparent"></div>
            <img
              className="w-full h-full object-cover"
              alt="Yogurt fresco con fresas"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWDpt3yWkqKkb516af9Vsg5KMpNM0Hu5--7z1V1SLWwt6vPBDfbYybEWW2K_BXfnorBaXvgtIMYoWEhInYY7lZFnbIwifcBsd-YK6PEpDBg17jnF72s3d3nXu8vonpZ-QBD8TdFgbBUB6NwLPJwADuARK-VFKvaZao7B7SO4-qF5MBaiSm5_QDy3MaUMmp9LtEQMx77oYul_7On9PnH1FOnxjQPImWXL5jjZVchNDNF4QhuH2OJSokCjXchJUTh5A3e6KI22zQgdI"
            />
            <div className="absolute bottom-4 left-4 z-20">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block uppercase tracking-widest">PEDIDO RÁPIDO</span>
              <h2 className="font-bold text-2xl text-white">Configura tu Fresh-Mix</h2>
            </div>
          </div>
        </section>

        {/* Form */}
        <form className="space-y-8" id="orderForm" onSubmit={handleSubmit}>
          {/* Customer Name */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-on-surface-variant block ml-1">Nombre del Cliente</label>
            <input
              className="w-full bg-surface-container-low border-2 border-outline-variant rounded-xl px-4 py-4 focus:border-primary focus:outline-none transition-all text-on-surface placeholder:text-on-surface-variant/50 text-base"
              placeholder="¿A quién saludamos hoy?"
              type="text"
            />
          </div>

          {/* Flavor Selection */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-on-surface-variant block ml-1">Elige tu Sabor</label>
            <div className="grid grid-cols-2 gap-3">
              {flavors.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFlavor(f.id)}
                  className={`bg-surface-container border p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    flavor === f.id
                      ? 'border-primary bg-primary/10'
                      : 'border-outline-variant hover:bg-surface-container-highest'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-3xl ${f.color}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {f.icon}
                  </span>
                  <span className="text-sm font-medium text-on-surface">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-on-surface-variant block ml-1">Tamaño Ideal</label>
            <div className="flex gap-2">
              {sizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSize(s.id)}
                  className={`flex-1 py-3 rounded-lg text-center text-sm font-medium transition-all border ${
                    size === s.id
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Freshness Indicator */}
        <div className="mt-12 p-4 bg-surface-container-high rounded-xl border border-white/5 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Nivel de Frescura</span>
              <span className="text-xs text-primary font-semibold">100% Óptimo</span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[95%] animate-pulse" style={{ boxShadow: '0 0 10px rgba(76,215,246,0.5)' }}></div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-surface/80 backdrop-blur-xl border-t border-outline-variant z-50">
        <button
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-150 flex items-center justify-center gap-3 ${
            done
              ? 'bg-green-500 text-white'
              : 'bg-primary text-on-primary active:scale-95'
          }`}
          style={{ boxShadow: '0 8px 30px rgba(76,215,246,0.2)' }}
          form="orderForm"
          type="submit"
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
              ¡Hecho!
            </>
          )}
          {!submitting && !done && (
            <>
              ¡Me llevo un Yogurt!
              <span className="material-symbols-outlined">shopping_cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
