import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background flex items-center justify-center p-4 overflow-hidden select-none font-sans">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface hover:text-primary hover:border-primary/50 transition-all active:scale-95 text-xs font-semibold shadow-md"
        title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
      >
        <span className="material-symbols-outlined text-[18px]">
          {theme === 'light' ? 'dark_mode' : 'light_mode'}
        </span>
        <span className="hidden sm:inline">
          {theme === 'light' ? 'Oscuro' : 'Claro'}
        </span>
      </button>
      {/* Ambient background glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card Container */}
        <div className="bg-surface-container/90 backdrop-blur-2xl border border-outline-variant p-8 sm:p-10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(12,161,242,0.12)] transition-all">
          
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4">
              <div className="w-20 h-20 bg-slate-900 border border-slate-700/60 rounded-2xl flex items-center justify-center mx-auto shadow-xl p-3 backdrop-blur-sm transition-transform duration-300 hover:scale-105">
                <img src="/favicon.png" alt="THÖRGURT Logo" className="w-full h-full object-contain drop-shadow" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-surface-container"></span>
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold uppercase tracking-widest mb-3">
              <span className="material-symbols-outlined text-[14px]">inventory_2</span>
              Control de Inventario
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              THÖRGURT
            </h1>
            <p className="text-on-surface-variant text-xs sm:text-sm mt-1.5 font-medium">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-6 p-4 bg-error-container/30 border border-error/40 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-error mt-0.5 text-[20px]">warning</span>
              <p className="text-xs sm:text-sm text-error font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block ml-1 mb-2">
                Correo Electrónico
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-12 pr-4 py-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
                  placeholder="admin@smartyogu.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block ml-1 mb-2">
                Contraseña
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-12 pr-12 py-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 mt-2 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 text-on-primary shadow-lg ${
                loading
                  ? 'bg-primary/50 cursor-not-allowed'
                  : 'bg-primary hover:brightness-110 active:scale-[0.98] shadow-primary/25 hover:shadow-primary/40'
              }`}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  Verificando...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer badge */}
          <div className="mt-8 pt-6 border-t border-outline-variant flex items-center justify-center gap-2 text-on-surface-variant text-xs font-medium">
            <span className="material-symbols-outlined text-green-400 text-[16px]">verified_user</span>
            Acceso seguro y cifrado con Supabase
          </div>
        </div>
      </div>
    </div>
  );
}
