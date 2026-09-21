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
      setError("Error de conexión al servidor");
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
      setError("Error de conexión al servidor");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Error al autenticar con Google')
  });

  return (
    <div className="flex min-h-screen bg-white font-sans selection:bg-black selection:text-white">
      
      {/* LADO IZQUIERDO - FORMULARIO LIMPIO */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex items-center justify-center p-6 sm:p-12 relative bg-white z-10 border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="w-full max-w-[400px]">
          
          <div className="mb-8 md:mb-10 flex justify-center md:justify-start">
             <img 
               src="/logo-dynova.jpeg" 
               alt="Dynova Logo" 
               className="h-12 md:h-14 w-auto object-contain mix-blend-multiply" 
             />
          </div>

          <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-[28px] font-bold text-gray-900 mb-2 tracking-tight">Iniciar Sesión</h1>
              <p className="text-gray-500 mb-8 text-sm">Bienvenido de vuelta. Ingresa a tu panel de control.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 mb-6 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {/* BOTÓN GOOGLE PREMIUM */}
          <div className="mb-6">
            <button 
                type="button"
                onClick={() => googleLogin()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-gray-700 shadow-sm disabled:opacity-70 text-[15px]"
            >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
            </button>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">O con correo</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Correo Electrónico</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="tu@empresa.com" 
                className="w-full border border-gray-200 px-3.5 py-2.5 rounded-lg bg-white outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-gray-900 text-[15px] placeholder-gray-400 shadow-sm" 
              />
            </div>
            
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full border border-gray-200 px-3.5 py-2.5 rounded-lg bg-white outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-gray-900 text-[15px] placeholder-gray-400 shadow-sm" 
              />
            </div>

            <div className="pt-2">
                <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-70 text-[15px] shadow-[0_2px_10px_rgba(0,0,0,0.1)]"
                >
                {loading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    'Iniciar Sesión'
                )}
                </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <p className="text-xs text-gray-400">Acceso seguro y encriptado. © 2026 Dynova.</p>
          </div>
        </div>
      </div>

      {/* LADO DERECHO - ESTILO B2B SÓLIDO (Tipo Stripe/Linear) */}
      <div className="hidden lg:flex flex-1 bg-[#0a0a0b] relative overflow-hidden flex-col justify-center items-center">
         
         {/* Iluminación tipo "Studio Light" súper sutil */}
         <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[120px] pointer-events-none"></div>
         <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>
         
         {/* Patrón de puntos (Grid) arquitectónico */}
         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>

         <div className="relative z-10 w-full max-w-[600px] px-12">
            
            {/* Etiqueta superior */}
            <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-zinc-400 text-xs font-semibold tracking-widest uppercase">Sistemas Operativos en Línea</span>
            </div>

            <h2 className="text-[42px] font-bold text-white mb-6 leading-[1.1] tracking-tight">
              Acelera tus ventas.<br/>
              <span className="text-zinc-500">Sin intervención humana.</span>
            </h2>
            <p className="text-[17px] text-zinc-400 leading-relaxed font-light mb-12 max-w-[450px]">
              Dynova es la infraestructura que automatiza la atención al cliente, clasifica prospectos y cierra ventas directamente en WhatsApp.
            </p>
            
            {/* Widget de Prueba Social / UI Mockup (Hiper realista) */}
            <div className="relative">
                {/* Sombra de profundidad del widget */}
                <div className="absolute inset-0 bg-black/40 blur-xl transform translate-y-4 rounded-2xl"></div>
                
                <div className="relative bg-[#111113] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                            <div>
                                <div className="text-white text-sm font-semibold">Conversión Exitosa</div>
                                <div className="text-zinc-500 text-xs">Vía WhatsApp Business</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-white text-sm font-mono font-medium">+ USD 1,250.00</div>
                            <div className="text-emerald-500 text-xs font-medium">Hace 2 min</div>
                        </div>
                    </div>
                    
                    {/* Gráfico Mockup minimalista */}
                    <div className="h-16 flex items-end gap-2 border-b border-white/5 pb-2">
                        <div className="w-full bg-white/5 rounded-t-sm h-[30%]"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-[50%]"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-[40%]"></div>
                        <div className="w-full bg-white/10 rounded-t-sm h-[70%]"></div>
                        <div className="w-full bg-white/20 rounded-t-sm h-[60%]"></div>
                        <div className="w-full bg-white/30 rounded-t-sm h-[90%] relative">
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-[10px] text-zinc-600 font-mono">10:00 AM</span>
                        <span className="text-[10px] text-zinc-600 font-mono">Ahora</span>
                    </div>
                </div>
            </div>

         </div>

      </div>

    </div>
  );
}

export default Login;
