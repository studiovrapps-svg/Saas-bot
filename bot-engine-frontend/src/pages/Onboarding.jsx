import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function Onboarding() {
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleComplete = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, phoneNumber })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Redirigir al dashboard principal del tenant (obtenemos el ID del JWT si es posible, o lo decodificamos)
        // Como no tenemos lib jwt-decode, el login devolvió tenant_id o rol.
        // Pero el Login hizo localStorage.setItem('token').
        // Idealmente hacemos fetch a algo que nos de el ID.
        // Pero para simplificar, lo sacaremos del token.
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            navigate(`/dashboard/${payload.tenant_id}`);
        } else {
            navigate('/');
        }
      } else {
        setError(data.error || 'Error al completar la configuración');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans selection:bg-black selection:text-white items-center justify-center p-4">
      
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-black/5 p-8 md:p-12 border border-gray-100">
          
        <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Casi listo</h1>
            <p className="text-gray-500 text-base">Para que el asistente de Inteligencia Artificial de Dynova funcione, necesitamos dos datos clave de tu negocio.</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 mb-6 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
        )}

        <form onSubmit={handleComplete} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de tu Negocio o Marca</label>
              <input 
                type="text" 
                required 
                value={businessName} 
                onChange={e => setBusinessName(e.target.value)} 
                placeholder="Ej. Zapatería El Sol" 
                className="w-full border border-gray-200 px-4 py-3.5 rounded-xl bg-gray-50/50 outline-none focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 transition-all text-gray-900 font-medium placeholder-gray-400" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Número de WhatsApp (con código de país)</label>
              <input 
                type="text" 
                required 
                value={phoneNumber} 
                onChange={e => setPhoneNumber(e.target.value)} 
                placeholder="Ej. +502 5555 5555" 
                className="w-full border border-gray-200 px-4 py-3.5 rounded-xl bg-gray-50/50 outline-none focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 transition-all text-gray-900 font-medium placeholder-gray-400" 
              />
            </div>

            <div className="pt-6">
                <button 
                type="submit" 
                disabled={loading || !businessName || !phoneNumber}
                className="w-full bg-black text-white px-4 py-4 rounded-xl hover:bg-gray-800 transition-all font-semibold shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none text-lg"
                >
                {loading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <>
                    Comenzar ahora
                    <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </>
                )}
                </button>
            </div>
        </form>
        
      </div>
    </div>
  );
}

export default Onboarding;
