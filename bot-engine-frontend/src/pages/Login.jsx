import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
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
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 font-sans">
      <form onSubmit={handleLogin} className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 relative overflow-hidden">
        
        {/* Adorno superior sutil */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-black"></div>

        <div className="flex justify-center mb-6 mt-2">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-1 text-center text-gray-900 tracking-tight">SaaS Bot Engine</h1>
        <p className="text-center text-sm text-gray-500 mb-8 font-medium">Ingresa a tu cuenta para continuar</p>
        
        {error && (
            <div className="bg-red-50 text-red-600 p-3 mb-6 rounded-lg text-sm text-center font-semibold border border-red-100 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
            </div>
        )}
        
        <div className="mb-5">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Correo Electrónico</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@empresa.com" className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm text-sm font-medium text-gray-800" />
        </div>
        
        <div className="mb-8">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Contraseña</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm text-sm font-medium text-gray-800" />
        </div>
        
        <button type="submit" className="w-full bg-black text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition font-bold shadow-lg flex items-center justify-center gap-2 text-sm">
          Iniciar Sesión
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>


      </form>
    </div>
  );
}
export default Login;