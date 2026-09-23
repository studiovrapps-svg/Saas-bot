import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        if (data.role === 'superadmin') navigate('/admin');
        else navigate(`/dashboard/${data.tenant_id}`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Error de conexin al servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/login/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleToken: tokenResponse.access_token || tokenResponse.credential || tokenResponse.id_token })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        
        if (data.needs_onboarding) {
            navigate('/onboarding');
        } else if (data.role === 'superadmin') {
            navigate('/admin');
        } else {
            navigate(`/dashboard/${data.tenant_id}`);
        }
      } else {
        setError(data.error || 'Error con Google Auth');
      }
    } catch (err) {
      setError("Error de conexin al servidor");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Error al autenticar con Google')
  });

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center p-4 relative selection:bg-black selection:text-white font-sans">
      
      {/* Fondo arquitectnico sutil */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-gray-200/50 to-transparent blur-3xl opacity-50"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNCkiLz48L3N2Zz4=')] opacity-50"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10">

        {/* CARTA PRINCIPAL */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 sm:p-10">
          
          {/* LOGO INTEGRADO Y GRANDE */}
          <div className="mb-8 flex justify-center">
             <img 
               src="/logo-dynova.jpeg" 
               alt="Dynova Logo" 
               className="h-[65px] w-auto object-contain mix-blend-multiply grayscale contrast-125" 
             />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Bienvenido de vuelta</h1>
            <p className="text-sm text-gray-500">Inicia sesión en tu panel de control</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 mb-6 rounded-lg text-sm font-medium border border-red-100 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {/* BOTÓN GOOGLE */}
          <button 
            type="button"
            onClick={() => googleLogin()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-gray-700 shadow-sm disabled:opacity-70 text-[14px]"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest">O usa tu correo</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Correo Electrónico</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="tu@empresa.com" 
                className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl bg-gray-50/50 outline-none focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 transition-all text-gray-900 text-[14px] placeholder-gray-400" 
              />
            </div>
            
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl bg-gray-50/50 outline-none focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 transition-all text-gray-900 text-[14px] placeholder-gray-400" 
              />
            </div>

            <div className="pt-2">
                <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black text-white px-4 py-3 rounded-xl hover:bg-gray-800 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-70 text-[14px] shadow-lg shadow-black/10 hover:shadow-black/20"
                >
                {loading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    'Iniciar Sesión'
                )}
                </button>
            </div>
          </form>
          
        </div>

        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 font-medium">Sistemas Operativos en Línea © 2026 Dynova.</p>
        </div>

      </div>
    </div>
  );
}

export default Login;
