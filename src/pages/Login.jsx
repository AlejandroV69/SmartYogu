import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
      // Éxito: redirigir al panel de admin
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-tertiary/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors active:scale-95 w-fit"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="font-medium text-sm">Volver al inicio</span>
        </button>

        <div className="bg-surface-container/80 backdrop-blur-xl border border-outline-variant p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-primary-container/20 text-on-primary-container rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-lg border border-primary/20 overflow-hidden">
            <img src="/favicon.png" alt="THÖRGURT Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Acceso Privado — THÖRGURT</h1>
          <p className="text-on-surface-variant text-sm mt-2">
            Inicia sesión para gestionar THÖRGURT
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-container/30 border border-error/40 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="material-symbols-outlined text-error mt-0.5 text-[20px]">warning</span>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-on-surface-variant block ml-1 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                mail
              </span>
              <input
                type="email"
                required
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-xl pl-12 pr-4 py-3 focus:border-primary focus:outline-none transition-all text-on-surface placeholder:text-on-surface-variant/50"
                placeholder="admin@smartyogu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface-variant block ml-1 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                key
              </span>
              <input
                type="password"
                required
                className="w-full bg-surface-container-low border-2 border-outline-variant rounded-xl pl-12 pr-4 py-3 focus:border-primary focus:outline-none transition-all text-on-surface placeholder:text-on-surface-variant/50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 mt-4 rounded-xl font-bold text-lg transition-all duration-150 flex items-center justify-center gap-2 ${
              loading
                ? 'bg-primary/50 text-on-primary/50 cursor-not-allowed'
                : 'bg-primary text-on-primary active:scale-95 shadow-[0_8px_30px_rgba(76,215,246,0.3)] hover:brightness-110'
            }`}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Verificando...
              </>
            ) : (
              <>
                Entrar al Panel
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
