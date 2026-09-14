import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Interceptor global para inyectar el token JWT en todas las peticiones a la API
const originalFetch = window.fetch;
window.fetch = async function () {
    let [resource, config] = arguments;
    if (typeof resource === 'string' && resource.includes('/api/')) {
        config = config || {};
        config.headers = config.headers || {};
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return originalFetch.apply(this, [resource, config]);
};

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

function SuperAdminDashboard() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeAdminTab, setActiveAdminTab] = useState("metricas");
  const [tenantFilter, setTenantFilter] = useState("activos");
  const [adminStats, setAdminStats] = useState(null);
  const [globalPricing, setGlobalPricing] = useState({ plans: { 1: 299, 2: 499, 3: 999 }, modules: { orders: 200, inbox: 150, crm: 100, campaigns: 250 } });
  const [systemLogs, setSystemLogs] = useState([]);
  const [toast, setToast] = useState(null);
  
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [unlockApi, setUnlockApi] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [breakdownModal, setBreakdownModal] = useState({ isOpen: false, type: 'mrr' });
  
  const [editData, setEditData] = useState(null);
  const [editTemplateData, setEditTemplateData] = useState(null);
  
  const [formData, setFormData] = useState({ name: "", email: "", password: "", bot_tier: 1, monthly_price: 0, template_id: "", features: {} });
  const [templateFormData, setTemplateFormData] = useState({ name: "", bot_tier: 1, system_prompt: "", business_rules: "[]" });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { 
    if(localStorage.getItem("role") !== "superadmin") {
        localStorage.clear();
        navigate("/");
        return;
    }
    fetchClientes();
    fetchTemplates();
    fetchAdminStats();
    fetchGlobalPricing();
  }, []);

  const fetchSystemLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/logs`);
      if (res.ok) {
        const data = await res.json();
        setSystemLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) { console.error(error); }
  };

  const fetchGlobalPricing = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/pricing`);
      if (res.ok) {
        const data = await res.json();
        setGlobalPricing(data);
      }
    } catch (error) { console.error(error); }
  };

  const handlePrintBreakdown = () => {
    const tableContent = document.getElementById('print-mrr-table').outerHTML;
    
    // Crear iframe oculto para imprimir sin abrir nueva ventana
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    
    let title = "Hoja Contable (MRR)";
    let subtitle = "Desglose de Ingresos Recurrentes";
    if (breakdownModal.type === 'cost') { title = "Reporte de Costos IA"; subtitle = "Desglose de Costo Operativo por Inquilino"; }
    else if (breakdownModal.type === 'margin') { title = "Reporte de Rentabilidad"; subtitle = "Desglose de Márgenes de Ganancia"; }
    else if (breakdownModal.type === 'interactions') { title = "Reporte de Tráfico"; subtitle = "Volumen de Interacciones por Inquilino"; }

    doc.write(`
      <html>
        <head>
          <title>${title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page { margin: 0; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 2cm !important; }
              .print\\:hidden { display: none !important; }
            }
          </style>
        </head>
        <body class="p-8">
          <div class="mb-8 border-b-4 border-indigo-600 pb-6 flex justify-between items-end">
              <div>
                  <h1 class="text-3xl font-black text-indigo-600 tracking-tighter">SAAS BOT</h1>
                  <p class="text-sm text-gray-500 font-medium tracking-widest uppercase mt-1">Plataforma de Inteligencia Artificial</p>
                  <div class="mt-4 text-xs text-gray-500 space-y-0.5">
                      <p>Ciudad de Guatemala, Guatemala</p>
                      <p>soporte@saasbot.com | +502 0000-0000</p>
                  </div>
              </div>
              <div class="text-right">
                  <h2 class="text-2xl font-bold text-gray-800">${title}</h2>
                  <p class="text-sm text-gray-500 mt-1">${subtitle}</p>
                  <div class="mt-4 text-xs font-semibold text-gray-700 bg-gray-100 inline-block px-3 py-1.5 rounded-lg border border-gray-200">
                      Emitido el: ${new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
              </div>
          </div>
          ${tableContent}
        </body>
      </html>
    `);
    doc.close();

    // Dar tiempo a Tailwind para procesar los estilos y luego lanzar print nativo
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // Limpiar iframe después de imprimir
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 800);
  };

  const handleSavePricing = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/pricing`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(globalPricing)
      });
      if (res.ok) {
        showToast("Precios actualizados correctamente");
        fetchAdminStats();
      }
    } catch (error) { 
      console.error(error);
      showToast("Error al guardar", "error");
    }
    setLoading(false);
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`);
      const data = await res.json();
      if(res.ok) {
        setAdminStats(data);
      } else {
        console.error("Error fetching admin stats:", data);
        setAdminStats({ error: true }); // Fallback to avoid infinite loading
      }
    } catch (error) { 
      console.error("Network error fetching admin stats:", error);
      setAdminStats({ error: true });
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await fetch(`${API_URL}/clientes`);
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) { console.error(error); }
  };

  const fetchTemplates = async () => {
      try {
          const res = await fetch(`${API_URL}/templates`);
          const data = await res.json();
          setTemplates(Array.isArray(data) ? data : []);
      } catch (error) { console.error(error); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clientes`, {
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: "", email: "", password: "", bot_tier: 1, monthly_price: 0, template_id: "", features: {} });
        fetchClientes();
        fetchAdminStats();
        showToast("Cliente creado exitosamente");
      } else {
        const data = await res.json();
        showToast(data.error || "Error al crear", "error");
      }
    } catch (error) { 
      console.error(error); 
      showToast("Error de conexión", "error");
    }
    setLoading(false);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clientes/${editData.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({
            name: editData.name,
            whatsapp_token: editData.whatsapp_token,
            whatsapp_phone_id: editData.whatsapp_phone_id,
            is_active: editData.is_active,
            bot_tier: editData.bot_tier,
            features: editData.features || {}
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchClientes();
        fetchAdminStats();
      }
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const handleCreateTemplate = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          let rules = [];
          try { rules = JSON.parse(templateFormData.business_rules); } catch(e) {}
          const res = await fetch(`${API_URL}/templates${editTemplateData ? "/"+editTemplateData.id : ""}`, {
              method: editTemplateData ? "PUT" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...templateFormData, business_rules: rules })
          });
          if (res.ok) {
              setShowTemplateModal(false);
              setTemplateFormData({ name: "", bot_tier: 1, system_prompt: "", business_rules: "[]" });
              setEditTemplateData(null);
              fetchTemplates();
          }
      } catch (error) { console.error(error); }
      setLoading(false);
  };

  const logout = () => { localStorage.clear(); navigate("/"); }

  const filteredClientes = clientes.filter(c => tenantFilter === "activos" ? c.is_active : !c.is_active);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden relative">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] px-6 py-4 rounded-xl shadow-2xl border text-sm font-bold flex items-center gap-3 transition-all animate-fade-in-up ${toast.type === 'success' ? 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]' : 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]'}`}>
          {toast.type === 'success' ? (
             <svg className="w-5 h-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          ) : (
             <svg className="w-5 h-5 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          )}
          {toast.message}
        </div>
      )}
      {showMobileMenu && <div onClick={() => setShowMobileMenu(false)} className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-20"></div>}
      <div className={`w-64 bg-white border-r border-gray-200 flex flex-col z-30 absolute inset-y-0 left-0 transform transition-transform duration-300 md:relative md:translate-x-0 ${showMobileMenu ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
             <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">SaaS Bot</h1>
              <p className="text-gray-500 text-xs font-bold tracking-wider uppercase">Super Admin</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div onClick={() => setActiveAdminTab("metricas")} className={`${activeAdminTab === "metricas" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            <span className="font-semibold text-sm">Métricas</span>
          </div>
          <div onClick={() => setActiveAdminTab("inquilinos")} className={`${activeAdminTab === "inquilinos" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="font-semibold text-sm">Inquilinos</span>
          </div>
          <div onClick={() => setActiveAdminTab("plantillas")} className={`${activeAdminTab === "plantillas" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
            <span className="font-semibold text-sm">Plantillas IA</span>
          </div>
          <div onClick={() => setActiveAdminTab("precios")} className={`${activeAdminTab === "precios" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-semibold text-sm">Precios Globales</span>
          </div>
          <div onClick={() => { setActiveAdminTab("logs"); fetchSystemLogs(); }} className={`${activeAdminTab === "logs" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="font-semibold text-sm">Logs del Sistema</span>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100">
            <button onClick={logout} className="w-full text-left text-gray-500 hover:text-gray-900 hover:bg-gray-50 p-2.5 rounded-lg font-semibold flex items-center gap-3 transition text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Cerrar Sesión
            </button>
        </div>
      </div>
      
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 z-10 shrink-0">
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <span className="font-bold text-gray-900">SaaS Bot Admin</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {activeAdminTab === "metricas" && !adminStats && (
                <div className="flex justify-center items-center h-64">
                    <p className="text-gray-500 font-medium">Cargando métricas...</p>
                </div>
            )}
            
            {activeAdminTab === "metricas" && adminStats?.error && (
                <div className="flex justify-center items-center h-64 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-red-500 font-medium">Error cargando métricas. Revisa la consola o asegúrate que el backend está corriendo.</p>
                </div>
            )}
            
            {activeAdminTab === "metricas" && adminStats && !adminStats.error && (
                <>
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Rentabilidad y Métricas Globales</h2>
                        <p className="text-gray-500 mt-1 text-sm">Monitoriza la salud financiera y el rendimiento de la Inteligencia Artificial.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                        <div onClick={() => setBreakdownModal({ isOpen: true, type: 'mrr' })} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:shadow-md transition-shadow hover:border-blue-200">
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Ingresos Mensuales</span>
                            </div>
                            <span className="text-xl md:text-3xl font-bold text-gray-900 tracking-tight">Q {(adminStats.total_mrr_gtq || 0).toFixed(2)}</span>
                        </div>
                        <div onClick={() => setBreakdownModal({ isOpen: true, type: 'cost' })} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:shadow-md transition-shadow hover:border-blue-200">
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                <span className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Costo Operativo</span>
                            </div>
                            <span className="text-xl md:text-3xl font-bold text-gray-900 tracking-tight">
                                Q {(adminStats.total_cost_gtq || 0).toFixed(2)}
                            </span>
                            <span className="text-[10px] md:text-xs text-gray-400 font-medium mt-1">USD {(adminStats.total_cost_usd || 0).toFixed(2)}</span>
                        </div>
                        <div onClick={() => setBreakdownModal({ isOpen: true, type: 'margin' })} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:shadow-md transition-shadow hover:border-blue-200">
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                <span className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Margen Ganancia</span>
                            </div>
                            <span className="text-xl md:text-3xl font-bold text-green-600 tracking-tight">Q {((adminStats.total_mrr_gtq || 0) - (adminStats.total_cost_gtq || 0)).toFixed(2)}</span>
                        </div>
                        <div onClick={() => setBreakdownModal({ isOpen: true, type: 'interactions' })} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:shadow-md transition-shadow hover:border-blue-200">
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                <span className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Interacciones</span>
                            </div>
                            <span className="text-xl md:text-3xl font-bold text-blue-600 tracking-tight">{adminStats.total_interactions || 0}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 tracking-tight">Evolución de Consumo (7 Días)</h3>
                            {adminStats.daily_usage.length > 0 ? (
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={adminStats.daily_usage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                            <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} tickFormatter={(value) => `Q ${value}`} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value) => [`Q ${value.toFixed(2)}`, "Costo"]} />
                                            <Area type="monotone" dataKey="cost_gtq" name="Costo (Q)" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-72 w-full flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-gray-400 font-medium">No hay suficientes datos de consumo</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 tracking-tight">Inquilinos con Mayor Consumo</h3>
                            <div className="space-y-4">
                                {adminStats.top_tenants.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No hay consumos registrados.</p>
                                ) : (
                                    adminStats.top_tenants.map((t, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition">
                                            <div>
                                                <p className="font-bold text-gray-800">{t.name}</p>
                                                <p className="text-xs text-gray-500">{t.tokens.toLocaleString()} tokens</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full text-sm">
                                                    Q {(t.cost_gtq || 0).toFixed(2)}
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-1">USD {(t.cost_usd || 0).toFixed(4)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeAdminTab === "inquilinos" && (
                <>
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Gestión de Inquilinos</h2>
                            <p className="text-gray-500 mt-1 text-sm">Administra las cuentas de las empresas, suscripciones y conexión a WhatsApp.</p>
                        </div>
                        <button onClick={() => setShowModal(true)} className="mt-4 md:mt-0 w-full md:w-auto bg-black text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 font-semibold shadow-sm transition text-sm flex items-center justify-center md:justify-start gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            Nuevo Cliente
                        </button>
                    </div>

                    <div className="flex gap-2 mb-4 border-b border-gray-200">
                        <button onClick={() => setTenantFilter("activos")} className={`px-4 py-3 text-sm font-bold border-b-2 transition ${tenantFilter === "activos" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                            Activos
                        </button>
                        <button onClick={() => setTenantFilter("suspendidos")} className={`px-4 py-3 text-sm font-bold border-b-2 transition ${tenantFilter === "suspendidos" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                            Suspendidos
                        </button>
                    </div>

                    <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {filteredClientes.length === 0 ? (
                            <p className="text-gray-500 italic text-center p-8">No hay clientes en esta categoría.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                                            <th className="p-4 font-semibold">Empresa</th>
                                            <th className="p-4 font-semibold">Acceso (Correo)</th>
                                            <th className="p-4 font-semibold">WhatsApp API</th>
                                            <th className="p-4 font-semibold">Estado</th>
                                            <th className="p-4 font-semibold">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClientes.map(c => (
                                            <tr key={c.id} className={`hover:bg-gray-50 transition ${!c.is_active ? "opacity-70 bg-red-50 hover:bg-red-100" : ""}`}>
                                                <td className="p-4 border-b font-bold text-gray-800">
                                                    {c.name}
                                                    <div className="text-xs font-semibold text-gray-500 mt-1">Nivel {c.bot_tier}</div>
                                                </td>
                                                <td className="p-4 border-b text-gray-600 text-sm">{c.email}</td>
                                                <td className="p-4 border-b">
                                                    {c.whatsapp_token && c.whatsapp_phone_id ? 
                                                        <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-semibold border border-gray-200">Conectado</span> :
                                                        <span className="text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-md font-semibold border border-yellow-200">Falta Configurar</span>
                                                    }
                                                </td>
                                                <td className="p-4 border-b">
                                                    {c.is_active ? 
                                                        <span className="text-gray-900 font-semibold text-sm flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Activo</span> : 
                                                        <span className="text-red-600 font-semibold text-sm flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Suspendido</span>
                                                    }
                                                </td>
                                                <td className="p-4 border-b">
                                                    <div className="flex gap-4 items-center">
                                                          <button onClick={() => { 
                                                            setEditData(c); 
                                                            setShowEditModal(true); 
                                                            setUnlockApi(false); 
                                                        }} className="text-gray-500 hover:text-black transition" title="Configurar">
                                                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                        </button>
                                                        <Link to={`/dashboard/${c.id}`} className="text-gray-500 hover:text-black transition" title="Ver Catálogo">
                                                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                      {/* Vista Móvil (Tarjetas) */}
                      <div className="md:hidden flex flex-col gap-4">
                          {filteredClientes.length === 0 ? (
                              <p className="text-gray-500 italic text-center p-8 bg-white rounded-xl border border-gray-200">No hay clientes en esta categoría.</p>
                          ) : (
                              filteredClientes.map(c => (
                                  <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm relative">
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <h3 className="font-bold text-gray-900 text-lg">{c.name}</h3>
                                              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Nivel {c.bot_tier}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                              <span className={`w-2.5 h-2.5 rounded-full ${c.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                              <span className="text-xs font-bold text-gray-700">{c.is_active ? 'Activo' : 'Suspendido'}</span>
                                          </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                          <span className="truncate">{c.email}</span>
                                      </div>
                                      
                                      <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                                          <div>
                                              {c.whatsapp_phone_id && c.whatsapp_token ? (
                                                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-md">Conectado API</span>
                                              ) : (
                                                  <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-bold px-2.5 py-1 rounded-md">Falta API</span>
                                              )}
                                          </div>
                                          <div className="flex gap-2">
                                              <button onClick={() => window.open(`/dashboard/${c.id}`, '_blank')} className="text-gray-500 hover:text-gray-900 p-1.5 rounded bg-gray-50 hover:bg-gray-100 transition" title="Ir al Panel">
                                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                              </button>
                                              <button onClick={() => { 
                                                  setEditData(c); 
                                                  setFormData({name: c.name, email: c.email, password: "", bot_tier: c.bot_tier, template_id: c.template_id || ""}); 
                                                  setShowEditModal(true); 
                                                  setUnlockApi(false); 
                                              }} className="text-gray-500 hover:text-green-600 p-1.5 rounded bg-gray-50 hover:bg-green-50 transition" title="Editar">
                                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                              </button>
                                              <button onClick={async () => {
                                                  if(window.confirm("¿Seguro que deseas eliminar este inquilino?")) {
                                                      try {
                                                          await fetch(`${API_URL}/clientes/${c.id}`, { method: 'DELETE' });
                                                          fetchClientes();
                                                          fetchAdminStats();
                                                      } catch (e) { console.error(e); }
                                                  }
                                              }} className="text-gray-500 hover:text-red-600 p-1.5 rounded bg-gray-50 hover:bg-red-50 transition" title="Eliminar">
                                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                </>
            )}

            {activeAdminTab === "plantillas" && (
                <>
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Plantillas de IA</h2>
                            <p className="text-gray-500 mt-1 text-sm">Crea configuraciones base (prompts y reglas) para industrias comunes.</p>
                        </div>
                        <button onClick={() => { setEditTemplateData(null); setTemplateFormData({ name: "", bot_tier: 1, system_prompt: "", business_rules: "[]" }); setShowTemplateModal(true); }} className="mt-4 md:mt-0 w-full md:w-auto bg-black text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 font-semibold shadow-sm transition text-sm flex items-center justify-center md:justify-start gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            Nueva Plantilla
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.length === 0 ? (
                            <p className="text-gray-500 italic p-4 col-span-full">No has creado plantillas todavía.</p>
                        ) : (
                            templates.map(t => (
                                <div key={t.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group hover:border-black transition flex flex-col">
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => { setEditTemplateData(t); setTemplateFormData({name: t.name, bot_tier: t.bot_tier, system_prompt: t.system_prompt || "", business_rules: JSON.stringify(t.business_rules) || "[]"}); setShowTemplateModal(true); }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-700">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={async () => { if(window.confirm("¿Borrar plantilla?")) { await fetch(`${API_URL}/templates/${t.id}`, {method:"DELETE"}); fetchTemplates(); } }} className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 text-red-600">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 mb-1">{t.name}</h3>
                                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block self-start">Nivel {t.bot_tier}</span>
                                    <p className="text-sm text-gray-500 mt-4 line-clamp-3 font-mono">{t.system_prompt || "Sin prompt base"}</p>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {activeAdminTab === "precios" && (
                <div className="max-w-2xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Precios Globales (Suscripciones y Módulos)</h2>
                        <p className="text-gray-500 mt-1 text-sm">Configura el costo en Quetzales (Q) base por cada nivel de suscripción y módulo. Estos valores aplican de forma uniforme y automática para calcular el MRR de todos los inquilinos.</p>
                    </div>

                    <form onSubmit={handleSavePricing} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Planes Base</h3>
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between">
                                <label className="font-semibold text-gray-700">Nivel 1</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 font-bold">Q</span>
                                    <input type="number" required value={globalPricing.plans?.[1] || 0} onChange={e => setGlobalPricing({...globalPricing, plans: {...globalPricing.plans, 1: Number(e.target.value)}})} className="w-24 border p-2 rounded-lg text-right bg-gray-50 outline-none focus:border-black font-bold" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="font-semibold text-gray-700">Nivel 2</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 font-bold">Q</span>
                                    <input type="number" required value={globalPricing.plans?.[2] || 0} onChange={e => setGlobalPricing({...globalPricing, plans: {...globalPricing.plans, 2: Number(e.target.value)}})} className="w-24 border p-2 rounded-lg text-right bg-gray-50 outline-none focus:border-black font-bold" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="font-semibold text-gray-700">Nivel 3</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 font-bold">Q</span>
                                    <input type="number" required value={globalPricing.plans?.[3] || 0} onChange={e => setGlobalPricing({...globalPricing, plans: {...globalPricing.plans, 3: Number(e.target.value)}})} className="w-24 border p-2 rounded-lg text-right bg-gray-50 outline-none focus:border-black font-bold" />
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Módulos Extra</h3>
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-700">Gestor de Pedidos</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 font-bold">Q</span>
                                    <input type="number" required value={globalPricing.modules?.orders || 0} onChange={e => setGlobalPricing({...globalPricing, modules: {...globalPricing.modules, orders: Number(e.target.value)}})} className="w-24 border p-2 rounded-lg text-right bg-gray-50 outline-none focus:border-black font-bold" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-700">Bandeja Multi-Agente</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 font-bold">Q</span>
                                    <input type="number" required value={globalPricing.modules?.inbox || 0} onChange={e => setGlobalPricing({...globalPricing, modules: {...globalPricing.modules, inbox: Number(e.target.value)}})} className="w-24 border p-2 rounded-lg text-right bg-gray-50 outline-none focus:border-black font-bold" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-700">CRM Automático</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 font-bold">Q</span>
                                    <input type="number" required value={globalPricing.modules?.crm || 0} onChange={e => setGlobalPricing({...globalPricing, modules: {...globalPricing.modules, crm: Number(e.target.value)}})} className="w-24 border p-2 rounded-lg text-right bg-gray-50 outline-none focus:border-black font-bold" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-700">Campañas Masivas</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 font-bold">Q</span>
                                    <input type="number" required value={globalPricing.modules?.campaigns || 0} onChange={e => setGlobalPricing({...globalPricing, modules: {...globalPricing.modules, campaigns: Number(e.target.value)}})} className="w-24 border p-2 rounded-lg text-right bg-gray-50 outline-none focus:border-black font-bold" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition">
                            {loading ? "Guardando..." : "Guardar Precios Globales"}
                        </button>
                    </form>
                </div>
            )}

            {activeAdminTab === "logs" && (
                <div className="max-w-6xl mx-auto flex flex-col h-full">
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Logs del Sistema</h2>
                            <p className="text-gray-500 mt-1 text-sm">Monitorea en tiempo real errores de Webhooks, caídas de API de Meta o fallos internos para soporte proactivo.</p>
                        </div>
                        <button onClick={fetchSystemLogs} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 flex items-center gap-2 text-sm transition">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Refrescar
                        </button>
                    </div>

                    <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                                    <tr>
                                        <th className="p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Fecha</th>
                                        <th className="p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Nivel</th>
                                        <th className="p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Inquilino</th>
                                        <th className="p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Tipo</th>
                                        <th className="p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Mensaje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {systemLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-gray-400 italic">No hay logs registrados todavía.</td>
                                        </tr>
                                    ) : (
                                        systemLogs.map(log => (
                                            <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                                <td className="p-4 text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.level === 'ERROR' ? 'bg-red-100 text-red-700' : log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {log.level}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-semibold text-gray-900">{log.tenant_name || 'Sistema'}</td>
                                                <td className="p-4 text-gray-500 font-mono text-xs">{log.event_type}</td>
                                                <td className="p-4">
                                                    <div className="text-gray-900 font-medium">{log.message}</div>
                                                    {log.details && Object.keys(log.details).length > 0 && (
                                                        <pre className="mt-1 text-[10px] text-gray-500 bg-gray-100 p-2 rounded overflow-x-auto max-w-md">
                                                            {JSON.stringify(log.details, null, 2)}
                                                        </pre>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Modal Hoja Contable Genérico */}
      {breakdownModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setBreakdownModal({ isOpen: false, type: null })}>
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 max-h-[95vh] overflow-y-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {breakdownModal.type === 'mrr' ? 'Hoja Contable: Ingresos Mensuales' : 
                             breakdownModal.type === 'cost' ? 'Reporte: Costo Operativo' :
                             breakdownModal.type === 'margin' ? 'Reporte: Margen de Ganancia' : 'Reporte: Interacciones'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {breakdownModal.type === 'mrr' ? 'Desglose de cálculo del MRR por inquilino' : 'Desglose detallado por inquilino'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrintBreakdown} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Imprimir
                        </button>
                        <button onClick={() => setBreakdownModal({ isOpen: false, type: null })} className="text-gray-400 hover:text-gray-700 bg-gray-100 p-2.5 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    {(() => {
                        const data = adminStats?.tenant_breakdown || [];
                        
                        if (breakdownModal.type === 'mrr') {
                            return (
                                <table id="print-mrr-table" className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-xs">
                                            <th className="py-3 px-4 font-semibold">Cliente</th>
                                            <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Plan Base</th>
                                            <th className="py-3 px-4 font-semibold">Módulos Extra</th>
                                            <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Módulos (Total)</th>
                                            <th className="py-3 px-4 font-bold text-gray-900 text-right whitespace-nowrap">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.length > 0 ? data.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition">
                                                <td className="py-3 px-4 font-bold text-gray-800">{row.tenant_name}</td>
                                                <td className="py-3 px-4 text-right text-gray-600 whitespace-nowrap">Q {row.plan_cost.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-gray-500 text-xs leading-relaxed">
                                                    {row.modules && row.modules.length > 0 ? row.modules.join(', ') : <span className="text-gray-300 italic">Ninguno</span>}
                                                </td>
                                                <td className="py-3 px-4 text-right text-gray-600 whitespace-nowrap">Q {row.modules_cost.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-right font-bold text-gray-900 whitespace-nowrap">Q {row.mrr_total.toFixed(2)}</td>
                                            </tr>
                                        )) : <tr><td colSpan="5" className="p-6 text-center text-gray-400 italic">No hay datos</td></tr>}
                                    </tbody>
                                    <tfoot className="bg-gray-50 border-t border-gray-200">
                                        <tr>
                                            <td colSpan="4" className="py-4 px-4 text-right font-bold text-gray-600 uppercase text-xs tracking-widest">Total Ingresos Recurrentes (MRR)</td>
                                            <td className="py-4 px-4 text-right font-black text-xl text-blue-600 tracking-tight whitespace-nowrap">Q {(adminStats?.total_mrr_gtq || 0).toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            );
                        }
                        
                        if (breakdownModal.type === 'cost') {
                            return (
                                <table id="print-mrr-table" className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-xs">
                                            <th className="py-3 px-4 font-semibold">Cliente</th>
                                            <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Costo (USD)</th>
                                            <th className="py-3 px-4 font-bold text-gray-900 text-right whitespace-nowrap">Costo Operativo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.length > 0 ? data.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition">
                                                <td className="py-3 px-4 font-bold text-gray-800">{row.tenant_name}</td>
                                                <td className="py-3 px-4 text-right text-gray-600 whitespace-nowrap">USD {row.cost_usd.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-right font-bold text-gray-900 whitespace-nowrap">Q {row.cost_gtq.toFixed(2)}</td>
                                            </tr>
                                        )) : <tr><td colSpan="3" className="p-6 text-center text-gray-400 italic">No hay datos</td></tr>}
                                    </tbody>
                                    <tfoot className="bg-gray-50 border-t border-gray-200">
                                        <tr>
                                            <td colSpan="2" className="py-4 px-4 text-right font-bold text-gray-600 uppercase text-xs tracking-widest">Costo Operativo Total</td>
                                            <td className="py-4 px-4 text-right font-black text-xl text-blue-600 tracking-tight whitespace-nowrap">Q {(adminStats?.total_cost_gtq || 0).toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            );
                        }

                        if (breakdownModal.type === 'margin') {
                            return (
                                <table id="print-mrr-table" className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-xs">
                                            <th className="py-3 px-4 font-semibold">Cliente</th>
                                            <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Ingreso (MRR)</th>
                                            <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Costo Operativo</th>
                                            <th className="py-3 px-4 font-bold text-gray-900 text-right whitespace-nowrap">Margen Ganancia</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.length > 0 ? data.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition">
                                                <td className="py-3 px-4 font-bold text-gray-800">{row.tenant_name}</td>
                                                <td className="py-3 px-4 text-right text-green-600 whitespace-nowrap">Q {row.mrr_total.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-right text-red-500 whitespace-nowrap">Q {row.cost_gtq.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-right font-bold text-gray-900 whitespace-nowrap">Q {row.margin_gtq.toFixed(2)}</td>
                                            </tr>
                                        )) : <tr><td colSpan="4" className="p-6 text-center text-gray-400 italic">No hay datos</td></tr>}
                                    </tbody>
                                    <tfoot className="bg-gray-50 border-t border-gray-200">
                                        <tr>
                                            <td colSpan="3" className="py-4 px-4 text-right font-bold text-gray-600 uppercase text-xs tracking-widest">Ganancia Neta Total</td>
                                            <td className="py-4 px-4 text-right font-black text-xl text-green-600 tracking-tight whitespace-nowrap">Q {((adminStats?.total_mrr_gtq || 0) - (adminStats?.total_cost_gtq || 0)).toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            );
                        }
                        
                        if (breakdownModal.type === 'interactions') {
                            return (
                                <table id="print-mrr-table" className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-xs">
                                            <th className="py-3 px-4 font-semibold">Cliente</th>
                                            <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Nivel de Bot</th>
                                            <th className="py-3 px-4 font-bold text-gray-900 text-right whitespace-nowrap">Total Interacciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.length > 0 ? data.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition">
                                                <td className="py-3 px-4 font-bold text-gray-800">{row.tenant_name}</td>
                                                <td className="py-3 px-4 text-right text-gray-600 whitespace-nowrap">Nivel {row.bot_tier}</td>
                                                <td className="py-3 px-4 text-right font-bold text-gray-900 whitespace-nowrap">{row.interactions}</td>
                                            </tr>
                                        )) : <tr><td colSpan="3" className="p-6 text-center text-gray-400 italic">No hay datos</td></tr>}
                                    </tbody>
                                    <tfoot className="bg-gray-50 border-t border-gray-200">
                                        <tr>
                                            <td colSpan="2" className="py-4 px-4 text-right font-bold text-gray-600 uppercase text-xs tracking-widest">Tráfico Total Mensual</td>
                                            <td className="py-4 px-4 text-right font-black text-xl text-blue-600 tracking-tight whitespace-nowrap">{adminStats?.total_interactions || 0}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            );
                        }
                        
                        return null;
                    })()}
                </div>
            </div>
        </div>
      )}
      
      {/* Modales Inquilinos */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 max-h-[95vh] overflow-y-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-gray-900">Registrar Cliente SaaS</h2>
                <form onSubmit={handleCreate}>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Plantilla Base (Opcional)</label>
                    <select value={formData.template_id} onChange={(e) => setFormData({...formData, template_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 mb-5 outline-none focus:border-black bg-gray-50 text-sm font-semibold text-gray-900">
                        <option value="">-- Sin Plantilla (Empezar de cero) --</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>

                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nombre Comercial</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 mb-5 outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm text-sm" placeholder="Ej: CDS Premium" />
                    
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Correo (Usuario)</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 mb-5 outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm text-sm" placeholder="cliente@correo.com" />
                    
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Contraseña Temporal</label>
                    <input type="text" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 mb-6 outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm text-sm" placeholder="123456" />
                    
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Plan de Suscripción</label>
                    <select value={formData.bot_tier} onChange={(e) => setFormData({...formData, bot_tier: Number(e.target.value)})} className="w-full border border-gray-200 p-2.5 mb-5 rounded-xl outline-none bg-gray-50 text-sm focus:border-black">
                        <option value={1}>Nivel 1 - Menú Básico</option>
                        <option value={2}>Nivel 2 - Flujos Conversacionales (Groq)</option>
                        <option value={3}>Nivel 3 - IA Premium Libre</option>
                    </select>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-5 py-2.5 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 transition text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition shadow-md text-sm flex items-center justify-center gap-2">
                            {loading ? "Procesando..." : (
                                <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                  Crear Cuenta
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {showEditModal && editData && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 max-h-[95vh] overflow-y-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Configuración Técnica</h2>
                </div>
                <form onSubmit={handleEdit} autoComplete="off">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nombre Comercial</label>
                    <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 mb-5 outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm text-sm" />
                    
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Plan de Suscripción</label>
                    <select value={editData.bot_tier} onChange={e => setEditData({...editData, bot_tier: Number(e.target.value)})} className="w-full border border-gray-200 p-2.5 mb-5 rounded-xl outline-none bg-gray-50 text-sm focus:border-black">
                        <option value={1}>Nivel 1 - Menú Básico</option>
                        <option value={2}>Nivel 2 - Flujos IA (Groq)</option>
                        <option value={3}>Nivel 3 - IA Premium Libre</option>
                    </select>

                    <div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                                <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z" /></svg>
                                Credenciales de Meta (Protegidas)
                            </h3>
                            {!unlockApi && editData.whatsapp_phone_id && (
                                <button type="button" onClick={() => setUnlockApi(true)} className="text-xs font-bold uppercase tracking-wider text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">Modificar</button>
                            )}
                        </div>
                        
                        {(!unlockApi && editData.whatsapp_phone_id) ? (
                            <div className="text-sm text-gray-500 italic flex items-center gap-2 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                Los tokens de WhatsApp están ocultos por seguridad.
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-bold mb-1 text-gray-500 uppercase tracking-wider">Phone ID</label>
                                <input type="text" autoComplete="off" data-lpignore="true" data-form-type="other" value={editData.whatsapp_phone_id || ""} onChange={e => setEditData({...editData, whatsapp_phone_id: e.target.value})} className="w-full font-mono border border-gray-200 p-2.5 mb-4 rounded-xl bg-gray-50 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm" placeholder="Ej: 10423456789" />
                                
                                <label className="block text-xs font-bold mb-1 text-gray-500 uppercase tracking-wider">Access Token Permanente</label>
                                <input type="password" autoComplete="new-password" data-lpignore="true" data-form-type="other" value={editData.whatsapp_token || ""} onChange={e => setEditData({...editData, whatsapp_token: e.target.value})} className="w-full font-mono border border-gray-200 p-2.5 rounded-xl bg-gray-50 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm" placeholder="EAAD... " />
                            </div>
                        )}
                    </div>

                      <div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-200">
                          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
                              <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                              Módulos Extra (Suscripción)
                          </h3>
                          <div className="flex flex-col gap-4">
                              <label className="flex items-center justify-between cursor-pointer">
                                  <span className="text-sm font-semibold text-gray-700">Gestor de Pedidos</span>
                                  <div className="relative inline-flex items-center">
                                      <input type="checkbox" checked={editData.features?.orders || false} onChange={e => setEditData({...editData, features: {...(editData.features || {}), orders: e.target.checked}})} className="sr-only peer" />
                                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                  </div>
                              </label>
                              <label className="flex items-center justify-between cursor-pointer">
                                  <span className="text-sm font-semibold text-gray-700">Bandeja Multi-Agente (Live Chat)</span>
                                  <div className="relative inline-flex items-center">
                                      <input type="checkbox" checked={editData.features?.inbox || false} onChange={e => setEditData({...editData, features: {...(editData.features || {}), inbox: e.target.checked}})} className="sr-only peer" />
                                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                  </div>
                              </label>
                              <label className="flex items-center justify-between cursor-pointer">
                                  <span className="text-sm font-semibold text-gray-700">CRM Automático</span>
                                  <div className="relative inline-flex items-center">
                                      <input type="checkbox" checked={editData.features?.crm || false} onChange={e => setEditData({...editData, features: {...(editData.features || {}), crm: e.target.checked}})} className="sr-only peer" />
                                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                  </div>
                              </label>
                              <label className="flex items-center justify-between cursor-pointer">
                                  <span className="text-sm font-semibold text-gray-700">Campañas Masivas (Broadcasts)</span>
                                  <div className="relative inline-flex items-center">
                                      <input type="checkbox" checked={editData.features?.campaigns || false} onChange={e => setEditData({...editData, features: {...(editData.features || {}), campaigns: e.target.checked}})} className="sr-only peer" />
                                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                  </div>
                              </label>
                          </div>
                      </div>

                      <div className="mb-8 p-5 border border-red-100 rounded-xl bg-red-50 flex items-center justify-between gap-4">
                        <label htmlFor="killswitch" className="cursor-pointer select-none">
                            <span className="font-bold text-red-700 block text-sm flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Suspender Servicio (Kill-Switch)
                            </span>
                            <span className="text-xs text-red-500 block mt-1">El bot dejará de responder inmediatamente.</span>
                        </label>
                        <label htmlFor="killswitch" className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" id="killswitch" checked={!editData.is_active} onChange={e => setEditData({...editData, is_active: !e.target.checked})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-5 py-2.5 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 transition text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition shadow-md text-sm flex items-center justify-center gap-2">
                            {loading ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Modal Plantilla */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowTemplateModal(false)}>
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 max-h-[95vh] overflow-y-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-gray-900">{editTemplateData ? "Editar Plantilla" : "Nueva Plantilla"}</h2>
                <form onSubmit={handleCreateTemplate}>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nombre de la Plantilla</label>
                    <input type="text" required value={templateFormData.name} onChange={(e) => setTemplateFormData({...templateFormData, name: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 mb-5 outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm text-sm" placeholder="Ej: Clínica Dental Base" />
                    
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Nivel de Bot Recomendado</label>
                    <select value={templateFormData.bot_tier} onChange={(e) => setTemplateFormData({...templateFormData, bot_tier: Number(e.target.value)})} className="w-full border border-gray-200 p-2.5 mb-6 rounded-xl outline-none bg-gray-50 text-sm focus:border-black">
                        <option value={2}>Nivel 2 - Flujos Conversacionales</option>
                        <option value={3}>Nivel 3 - IA Premium Libre</option>
                    </select>

                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">System Prompt (Personalidad)</label>
                    <textarea value={templateFormData.system_prompt} onChange={(e) => setTemplateFormData({...templateFormData, system_prompt: e.target.value})} className="w-full border border-gray-200 p-2.5 mb-4 rounded-xl outline-none bg-gray-50 text-xs font-mono resize-none focus:border-black" rows="6" placeholder="Eres un asistente de una clínica..."></textarea>
                    
                    <div className="flex gap-3 mt-4">
                        <button type="button" onClick={() => setShowTemplateModal(false)} className="flex-1 px-5 py-2.5 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 transition text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition shadow-md text-sm flex items-center justify-center gap-2">
                            {loading ? "Guardando..." : "Guardar Plantilla"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
      </div>
    </div>
  );
}

function ClientDashboard() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [chatSearch, setChatSearch] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
    const [modalImage, setModalImage] = useState(null);
    const [imageZoom, setImageZoom] = useState(1);
    const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageDragRef = useRef(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState('bot');
  const [chatLatestOrder, setChatLatestOrder] = useState(null);
  const [showChatOrderDetails, setShowChatOrderDetails] = useState(false);
    const [messageLimit, setMessageLimit] = useState(50);
    const [chatListLimit, setChatListLimit] = useState(50);
    const [orderPage, setOrderPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [orderFilter, setOrderFilter] = useState('pendiente');
    
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
    
    // Observers refs
    const bottomAnchorRef = useRef(null);
    const loadMoreMessagesRef = useRef(null);
    const loadMoreChatsRef = useRef(null);
    
    // Reset button state when switching chats or tabs
    useEffect(() => {
        setShowScrollBottomBtn(false);
    }, [activeChat, activeTab]);

    const handleChatScroll = (e) => {
        // En flex-col-reverse, el scroll visualmente hasta abajo significa que scrollTop está muy cerca de 0.
        // Tolerancia de 20px para evitar que desaparezca por pequeños márgenes.
        const atBottom = Math.abs(e.target.scrollTop) <= 20;
        setShowScrollBottomBtn(!atBottom);
    };
    // Infinite Scroll Observers
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setMessageLimit(prev => prev + 50);
            }
        }, { root: chatContainerRef.current, rootMargin: "50px", threshold: 0 });
        if (loadMoreMessagesRef.current) observer.observe(loadMoreMessagesRef.current);
        return () => observer.disconnect();
    }, [chatMessages.length]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setChatListLimit(prev => prev + 50);
            }
        }, { rootMargin: "50px", threshold: 0 });
        if (loadMoreChatsRef.current) observer.observe(loadMoreChatsRef.current);
        return () => observer.disconnect();
    }, [chatList.length]);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();
  const [formData, setFormData] = useState({ name: '', description: '', price: '' });
  const [imageFile, setImageFile] = useState(null);
  const [editProductId, setEditProductId] = useState(null);

  // Polling para lista de chats
  useEffect(() => {
    let interval;
    if (activeTab === 'inbox') {
      const fetchChats = async () => {
        try {
          const res = await fetch(`${API_URL}/tenant/${tenantId}/chats?limit=${chatListLimit}`);
          const data = await res.json();
          setChatList(Array.isArray(data) ? data : []);
        } catch(e) {}
      };
      fetchChats();
      interval = setInterval(fetchChats, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab, tenantId, chatListLimit]);

  // Polling para mensajes activos
  useEffect(() => {
    let interval;
    if (activeTab === 'inbox' && activeChat) {
      const fetchMessages = async () => {
        try {
          const res = await fetch(`${API_URL}/tenant/${tenantId}/chats/${activeChat}?limit=${messageLimit}`);
          const data = await res.json();
          setChatMessages(Array.isArray(data) ? data : []);
        } catch(e) {}
      };
      fetchMessages();
      interval = setInterval(fetchMessages, 3000);
    }
    return () => clearInterval(interval);
  }, [activeTab, activeChat, tenantId, messageLimit]);

  useEffect(() => {
      if (activeTab === 'inbox' && activeChat) {
          setShowChatOrderDetails(false); // Reset modal
          fetch(`${API_URL}/tenant/${tenantId}/orders?phone=${encodeURIComponent(activeChat)}&limit=1`)
              .then(res => res.json())
              .then(resData => {
                  const dataArray = Array.isArray(resData) ? resData : (resData.data || []);
                  setChatLatestOrder(dataArray.length > 0 ? dataArray[0] : null);
              })
              .catch(() => setChatLatestOrder(null));
      } else {
          setChatLatestOrder(null);
      }
  }, [activeChat, activeTab, tenantId]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeChat) return;
    const text = replyText;
    setReplyText("");
    
    // Optistic update
    setChatMessages(prev => [...prev, { id: Date.now(), direction: 'outbound', content: text, created_at: new Date().toISOString() }]);

    try {
      await fetch(`${API_URL}/tenant/${tenantId}/chats/${activeChat}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      });
    } catch(e) {
      console.error(e);
    }
  };

  const [systemPrompt, setSystemPrompt] = useState("");
  const [faqs, setFaqs] = useState([{ q: '', a: '' }]);
  const [tier1Greeting, setTier1Greeting] = useState("");
  const [tier1Menu, setTier1Menu] = useState([]);
  const [savingPrompt, setSavingPrompt] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, index: null });
  

      useEffect(() => { 
    if(!localStorage.getItem('token')) navigate('/');
    fetchData(); 

    // Inicializar Facebook SDK para Embedded Signup
    window.fbAsyncInit = function() {
        window.FB.init({
            appId      : 'AQUI_TU_APP_ID_DE_META', // REEMPLAZAR CON TU APP ID
            cookie     : true,
            xfbml      : true,
            version    : 'v19.0'
        });
    };
    (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, [tenantId]);

  const fetchData = async () => {
    try {
      const resP = await fetch(`${API_URL}/productos/${tenantId}`);
      const dataP = await resP.json();
      setProductos(Array.isArray(dataP) ? dataP : []);
      
      const resT = await fetch(`${API_URL}/tenant/${tenantId}`);
      const dataT = await resT.json();
      setTenantInfo(dataT);
      setSystemPrompt(dataT?.system_prompt || "");
      try {
          const parsed = JSON.parse(dataT?.business_rules || "[]");
          setFaqs(Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ q: '', a: '' }]);
      } catch(e) {
          setFaqs([{ q: 'Información', a: dataT?.business_rules || '' }]);
      }
      setTier1Greeting(dataT?.tier1_greeting || "");
      setTier1Menu(dataT?.tier1_menu || []);
    } catch (error) { console.error(error); }
  };

  const handleSaveConfig = async () => {
      setSavingPrompt(true);
      try {
          const validFaqs = faqs.filter(f => f.q.trim() || f.a.trim());
          await fetch(`${API_URL}/tenant/${tenantId}/config`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ system_prompt: systemPrompt, business_rules: JSON.stringify(validFaqs), tier1_greeting: tier1Greeting, tier1_menu: tier1Menu })
          });
          alert("Configuración de IA guardada.");
      } catch(err) { console.error(err); }
      setSavingPrompt(false);
  };

    const handleImageUploadMenu = async (idx, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const res = await fetch(`${API_URL}/tenant/${tenantId}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.url) {
                let nm = [...tier1Menu];
                nm[idx].image_url = data.url;
                setTier1Menu(nm);
            } else {
                alert("Error subiendo imagen: " + (data.error || ""));
            }
        } catch (e) {
            console.error(e);
            alert("Error subiendo imagen");
        }
    };

  const handleAddMenu = () => {
      if(tier1Menu.length >= 9) return alert("Máximo 9 opciones extra (Meta limita a 10 total).");
      setTier1Menu([...tier1Menu, { title: "", response: "" }]);
  };

  const handleFileChange = (e) => { if (e.target.files) setImageFile(e.target.files[0]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editProductId && !imageFile) return alert("Falta foto");
    setLoading(true);
    const data = new FormData();
    data.append('tenant_id', tenantId);
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    if (imageFile) data.append('image', imageFile);

    try {
      const endpoint = editProductId ? `${API_URL}/productos/${editProductId}` : `${API_URL}/productos`;
      const method = editProductId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, { method, body: data });
      
      if (res.ok) {
        setShowModal(false); 
        setFormData({ name: '', description: '', price: '' }); 
        setImageFile(null);
        setEditProductId(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        fetchData();
      }
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const handleEditProduct = (p) => {
      setFormData({ name: p.name, description: p.description, price: p.price });
      setImageFile(null);
      setEditProductId(p.id);
      setShowModal(true);
  };

  const handleDelete = (id) => {
      setDeleteConfirm({ isOpen: true, type: 'producto', index: id });
  };

              
  useEffect(() => {
    if (activeTab === 'pedidos') {
      fetchOrders();
    }
  }, [activeTab, orderPage, orderFilter]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetch(`${API_URL}/tenant/${tenantId}/stats`)
        .then(res => res.json())
        .then(data => setDashboardStats(data))
        .catch(console.error);
    }
  }, [activeTab, tenantId]);

  const fetchOrders = async (showSpinner = true) => {
    if (showSpinner) setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/tenant/${tenantId}/orders?page=${orderPage}&limit=25&status=${orderFilter}`);
      const resData = await res.json();
      if (Array.isArray(resData)) {
        setOrders(resData);
        setTotalOrders(resData.length);
      } else if (resData.data && Array.isArray(resData.data)) {
        setOrders(resData.data);
        setTotalOrders(resData.total || 0);
      } else {
        setOrders([]);
        setTotalOrders(0);
      }
    } catch(e) {
      console.error(e);
      setOrders([]);
    }
    if (showSpinner) setLoadingOrders(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    // Optimistic UI Update
    setOrders(prevOrders => prevOrders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    
    try {
      await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      // Silent refresh
      fetchOrders(false);
    } catch(e) {
      console.error(e);
      // Revert/refresh if error
      fetchOrders(false);
    }
  };

  const handleMetaLogin = () => {
        if (!window.FB) {
            alert("⚠️ El SDK de Facebook no ha cargado. Revisa tu consola de internet.");
            return;
        }

        // Simplemente mostraremos la alerta siempre si sabemos que el ID no se ha cambiado
        // Check if the script was initialized with the placeholder
        if (document.body.innerHTML.includes('AQUI_TU_APP_ID_DE_META')) {
            alert("🛑 ¡Alto ahí! Aún no has puesto tu APP_ID de Meta en el código. Abre App.jsx y reemplaza 'AQUI_TU_APP_ID_DE_META' con tu ID real de Meta for Developers.");
            return;
        }

        console.log("Iniciando popup de Meta...");
        window.FB.login((response) => {
            console.log("Respuesta de Meta:", response);
            if (response.authResponse) {
                const accessToken = response.authResponse.accessToken;
                linkWhatsAppAccount(accessToken);
            } else {
                alert('Cancelaste la ventana de Meta o hubo un error de conexión.');
            }
        }, {
            config_id: 'AQUI_TU_CONFIG_ID', // Requerido para Embedded Signup
            response_type: 'code',
            override_default_response_type: true,
            extras: { setup: {  } }
        });
    };

    const linkWhatsAppAccount = async (accessToken) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/tenant/${tenantId}/meta-connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken })
            });
            if (res.ok) {
                alert('¡WhatsApp conectado con éxito en modo Coexistencia!');
                fetchData();
            } else {
                alert('Error al conectar WhatsApp');
            }
        } catch(e) { console.error(e); }
        setLoading(false);
    };

    const logout = () => { localStorage.clear(); navigate('/'); }

  if (!tenantInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Cargando tu espacio de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden relative">
      {/* Sidebar Izquierdo (Modo Claro/Elegante) */}
      {showMobileMenu && <div onClick={() => setShowMobileMenu(false)} className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-20"></div>}
      <div className={`w-64 bg-white border-r border-gray-200 flex flex-col z-30 absolute inset-y-0 left-0 transform transition-transform duration-300 md:relative md:translate-x-0 ${showMobileMenu ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">SaaS Bot</h1>
          <p className="text-gray-500 text-xs mt-1 font-semibold tracking-wider uppercase">Workspace</p>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div onClick={() => { setActiveTab('dashboard'); setShowMobileMenu(false); }} className={`${activeTab === 'dashboard' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <span className="font-semibold text-sm">Dashboard</span>
          </div>
          
          {tenantInfo?.features?.inbox && (
            <div onClick={() => { setActiveTab('inbox'); setShowMobileMenu(false); }} className={`${activeTab === 'inbox' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <span className="font-semibold text-sm">Bandeja de Entrada</span>
            </div>
          )}

          {tenantInfo?.features?.orders !== false && (
            <div onClick={() => { setActiveTab('pedidos'); setShowMobileMenu(false); }} className={`${activeTab === 'pedidos' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <span className="font-semibold text-sm">Pedidos</span>
            </div>
          )}

          <div onClick={() => { setActiveTab('productos'); setShowMobileMenu(false); }} className={`${activeTab === 'productos' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            <span className="font-semibold text-sm">Productos</span>
          </div>

          {tenantInfo?.features?.campaigns && (
            <div onClick={() => { setActiveTab('campaigns'); setShowMobileMenu(false); }} className={`${activeTab === 'campaigns' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
              <span className="font-semibold text-sm">Campañas Masivas</span>
            </div>
          )}

          <div onClick={() => { setActiveTab('chatbots'); setShowMobileMenu(false); }} className={`${activeTab === 'chatbots' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span className="font-semibold text-sm">Chatbots</span>
          </div>

          <div onClick={() => { setActiveTab('configuracion'); setShowMobileMenu(false); }} className={`${activeTab === 'configuracion' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="font-semibold text-sm">Configuración</span>
          </div>

          <div onClick={() => { setActiveTab('afiliados'); setShowMobileMenu(false); }} className={`${activeTab === 'afiliados' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="font-semibold text-sm">Afiliados (Partners)</span>
          </div>
            </div>
          <div className="p-4 border-t border-gray-100">
          {localStorage.getItem('role') === 'superadmin' ? (
            <button onClick={() => navigate('/admin')} className="w-full text-left text-gray-900 hover:text-blue-800 hover:bg-gray-100 p-2.5 rounded-lg font-semibold flex items-center gap-3 transition text-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Volver a Súper Admin
              </button>
          ) : (
            <button onClick={logout} className="w-full text-left text-gray-500 hover:text-gray-900 hover:bg-gray-50 p-2.5 rounded-lg font-semibold flex items-center gap-3 transition text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Cerrar Sesión
            </button>
          )}
        </div>
      </div>

      {/* Contenido Principal (Derecha) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Navbar Superior */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-10">
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden mr-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg></button>
          <div className="flex items-center gap-4">
            
            <h2 className="text-sm font-semibold text-gray-800">{tenantInfo?.name || "Cargando..."}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs">
              {tenantInfo?.name ? tenantInfo.name.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
        </div>

        {/* Área de Trabajo (Scroll) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            
                          {activeTab === 'dashboard' && (
                <div className="space-y-4 mt-1 max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Resumen de Actividad</h2>
                        <p className="text-sm text-gray-500 mt-1">Monitorea el rendimiento de tu bot y tus ventas diarias.</p>
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Tarjeta 1: Ventas */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2 sm:mb-4">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-500 truncate mr-2">Ingresos Totales</h4>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight truncate">Q{dashboardStats?.total_revenue?.toLocaleString('es-GT') || '0'}</p>
                            <p className="text-xs sm:text-xs text-emerald-600 font-medium mt-1 truncate">↑ 12% vs mes anterior</p>
                        </div>
                    </div>
                    
                    {/* Tarjeta 2: Pedidos */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2 sm:mb-4">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-500 truncate mr-2">Pedidos Pendientes</h4>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        </div>
                        <div>
                            <p className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight truncate">{dashboardStats?.pending_orders || '0'}</p>
                            <p className="text-xs sm:text-xs text-gray-400 font-medium mt-1 truncate">Por despachar hoy</p>
                        </div>
                    </div>

                    {/* Tarjeta 3: Chats */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2 sm:mb-4">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-500 truncate mr-2">Total de Chats</h4>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <div>
                            <p className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight truncate">{dashboardStats?.total_conversations || '0'}</p>
                            <p className="text-xs sm:text-xs text-gray-400 font-medium mt-1 truncate">En el historial</p>
                        </div>
                    </div>

                    {/* Tarjeta 4: Productos */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2 sm:mb-4">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-500 truncate mr-2">Catálogo Activo</h4>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </div>
                        <div>
                            <p className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight truncate">{dashboardStats?.total_products || '0'}</p>
                            <p className="text-xs sm:text-xs text-gray-400 font-medium mt-1 truncate">Productos disponibles</p>
                        </div>
                    </div>
                  </div>

                  {/* Gráfica Area */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] mt-4">
                    <div className="mb-4 flex justify-between items-end">
                        <div>
                            <h3 className="text-base font-medium text-gray-900">Rendimiento</h3>
                            <p className="text-sm text-gray-500 mt-1">Volumen de mensajes y pedidos en los últimos 7 días</p>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                { name: 'Lun', chats: 12, pedidos: 2 },
                                { name: 'Mar', chats: 19, pedidos: 5 },
                                { name: 'Mié', chats: 15, pedidos: 3 },
                                { name: 'Jue', chats: 22, pedidos: 8 },
                                { name: 'Vie', chats: 30, pedidos: 12 },
                                { name: 'Sáb', chats: 45, pedidos: 20 },
                                { name: 'Dom', chats: 40, pedidos: 15 },
                            ]} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                                <defs>
                                    <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '13px'}} />
                                <Area type="monotone" dataKey="chats" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorChats)" name="Mensajes Recibidos" />
                                <Area type="monotone" dataKey="pedidos" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPedidos)" name="Pedidos Generados" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}



      {/* SECCIÓN CAMPAÑAS MASIVAS */}
      {activeTab === 'campaigns' && tenantInfo && tenantInfo.features?.campaigns && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-indigo-50 to-white px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 bg-indigo-100 text-gray-900 rounded-lg">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                      </div>
                      <h2 className="text-xl font-bold text-gray-800">Campañas Masivas (Broadcasts)</h2>
                  </div>
                  <p className="text-sm text-gray-500 ml-12">Dispara plantillas promocionales a toda tu base de datos de WhatsApp.</p>
              </div>

              <div className="p-8">
                  <div className="flex flex-col lg:flex-row gap-8">
                      {/* Left: Input & Action */}
                      <div className="flex-1">
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 h-full flex flex-col justify-center">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre exacto de la plantilla</label>
                              <input type="text" id="campaignTemplateName" placeholder="Ej: promo_navidad_2026" className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-black focus:border-transparent transition mb-4 text-sm bg-white shadow-sm" />
                              
                              <button onClick={async () => {
                                  const templateName = document.getElementById('campaignTemplateName').value;
                                  if (!templateName) return alert('Debes escribir el nombre de la plantilla.');
                                  if (!confirm('¿Estás seguro de enviar esta campaña a toda tu base de datos? Esta acción no se puede deshacer.')) return;
                                  
                                  try {
                                      const tId = tenantInfo.id;
                                      const res = await fetch(`${API_URL}/tenant/${tId}/campaigns/send`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ template_name: templateName })
                                      });
                                      const data = await res.json();
                                      if (res.ok) {
                                          alert(data.message);
                                          document.getElementById('campaignTemplateName').value = '';
                                      } else {
                                          alert('Error: ' + data.error);
                                      }
                                  } catch(e) {
                                          alert('Error de conexión al servidor.');
                                  }
                              }} className="w-full bg-black hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition flex items-center justify-center gap-2 text-sm">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                                  Iniciar Envío Masivo
                              </button>
                          </div>
                      </div>

                      {/* Right: Warning / Info */}
                      <div className="flex-[1.2]">
                          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 h-full shadow-sm">
                              <div className="flex items-start gap-3">
                                  <div className="mt-0.5">
                                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                  </div>
                                  <div>
                                      <h3 className="font-semibold text-orange-800 text-sm mb-1">Acerca de los costos de envío</h3>
                                      <p className="text-xs text-orange-700 leading-relaxed mb-3">
                                          Las campañas masivas de WhatsApp (Broadcasts) tienen un costo por conversación establecido oficialmente por Meta.
                                      </p>
                                      <ul className="text-xs text-orange-700 list-disc list-inside space-y-2">
                                          <li>El costo se cobra de forma directa a la tarjeta vinculada en tu <strong>Meta Business Manager</strong>.</li>
                                          <li>Meta solo te cobrará por los mensajes entregados exitosamente.</li>
                                          <li>Esta plataforma no aplica ninguna comisión o recargo sobre tus envíos.</li>
                                      </ul>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

              
              {activeTab === 'pedidos' && (
                <div className="max-w-6xl mx-auto mt-4">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h2>
                      <p className="text-gray-500 text-sm mt-1">Administra las compras realizadas a través del bot.</p>
                    </div>
                    <button onClick={fetchOrders} className="text-sm bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Actualizar
                    </button>
                  </div>

                  {/* Filtros de Pedidos */}
                  <div className="flex space-x-2 border-b border-gray-200 mb-6 overflow-x-auto custom-scrollbar">
                      {[
                          { id: 'pendiente', label: 'Pendientes' },
                          { id: 'en_proceso', label: 'En Proceso' },
                          { id: 'todos', label: 'Todos' },
                          { id: 'completado', label: 'Completados' },
                          { id: 'cancelado', label: 'Cancelados' }
                      ].map(filter => (
                          <button
                              key={filter.id}
                              onClick={() => { setOrderFilter(filter.id); setOrderPage(1); }}
                              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                                  orderFilter === filter.id 
                                  ? 'border-indigo-500 text-gray-900' 
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                          >
                              {filter.label}
                          </button>
                      ))}
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse hidden md:table">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Resumen</th>
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Dirección</th>
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loadingOrders ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Cargando pedidos...</td></tr>
                                ) : (!orders || orders.length === 0) ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No hay pedidos aún.</td></tr>
                                ) : orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 text-sm text-gray-600 align-top">
                                            {new Date(order.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-900 align-top">
                                            <div className="flex items-center gap-2">
                                                <span>{order.customer_phone?.startsWith('+') ? order.customer_phone : `+${order.customer_phone}`}</span>
                                                <button 
                                                    onClick={() => {
                                                        setActiveChat(order.customer_phone);
                                                        setActiveTab('inbox');
                                                    }}
                                                    className="text-green-500 hover:text-green-600 bg-green-50 hover:bg-green-100 p-1.5 rounded-full transition-colors shadow-sm"
                                                    title="Ir al chat"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <ul className="text-sm text-gray-700 space-y-1">
                                                {(() => {
                                                    try {
                                                        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                                                        if (!Array.isArray(items)) return <li className="text-gray-400">Sin items</li>;
                                                        return items.map((i, idx) => (
                                                            <li key={idx} className="flex gap-2"><span className="text-gray-400 font-bold">{i.quantity || i.qty}x</span> <span className="font-medium text-gray-800">{i.product || i.name}</span></li>
                                                        ));
                                                    } catch(e) { return <li className="text-red-400">Error leyendo items</li>; }
                                                })()}
                                            </ul>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 align-top max-w-xs truncate" title={order.delivery_address}>
                                            {order.delivery_address}
                                        </td>
                                        <td className="p-4 align-top">
                                            <select 
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                className={`text-xs font-bold px-2 py-1 rounded-full border-2 outline-none cursor-pointer ${
                                                    order.status === 'pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    order.status === 'completado' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    order.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}
                                            >
                                                <option value="pendiente">Pendiente</option>
                                                <option value="en_proceso">En Proceso</option>
                                                <option value="completado">Completado</option>
                                                <option value="cancelado">Cancelado</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Mobile View: Cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {loadingOrders ? (
                                <div className="p-8 text-center text-gray-500">Cargando pedidos...</div>
                            ) : (!orders || orders.length === 0) ? (
                                <div className="p-8 text-center text-gray-500">No hay pedidos aún.</div>
                            ) : orders.map(order => (
                                <div key={order.id} className="p-4 bg-white hover:bg-gray-50 transition flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <span>{order.customer_phone?.startsWith('+') ? order.customer_phone : `+${order.customer_phone}`}</span>
                                            <button 
                                                onClick={() => {
                                                    setActiveChat(order.customer_phone);
                                                    setActiveTab('inbox');
                                                }}
                                                className="text-green-500 hover:text-green-600 bg-green-50 hover:bg-green-100 p-1 rounded-full transition-colors"
                                                title="Ir al chat"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {new Date(order.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <ul className="text-sm text-gray-700 space-y-1">
                                            {(() => {
                                                try {
                                                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                                                    if (!Array.isArray(items)) return <li className="text-gray-400">Sin items</li>;
                                                    return items.map((i, idx) => (
                                                        <li key={idx} className="flex gap-2">
                                                            <span className="text-gray-900 font-bold">{i.quantity || i.qty}x</span> 
                                                            <span className="font-medium text-gray-800">{i.product || i.name}</span>
                                                        </li>
                                                    ));
                                                } catch(e) { return <li className="text-red-400">Error leyendo items</li>; }
                                            })()}
                                        </ul>
                                    </div>

                                    <div className="text-sm text-gray-600 flex items-start gap-2">
                                        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span className="break-words">{order.delivery_address}</span>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</span>
                                        <select 
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 outline-none cursor-pointer shadow-sm ${
                                                order.status === 'pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                order.status === 'completado' ? 'bg-green-50 text-green-700 border-green-200' :
                                                order.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}
                                        >
                                            <option value="pendiente">Pendiente</option>
                                            <option value="en_proceso">En Proceso</option>
                                            <option value="completado">Completado</option>
                                            <option value="cancelado">Cancelado</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Paginación Clásica */}
                    {totalOrders > 25 && (
                        <div className="flex justify-between items-center px-4 py-3 bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-sm mt-0">
                            <div className="hidden sm:block">
                                <p className="text-sm text-gray-700">
                                    Mostrando del <span className="font-medium">{(orderPage - 1) * 25 + 1}</span> al <span className="font-medium">{Math.min(orderPage * 25, totalOrders)}</span> de <span className="font-medium">{totalOrders}</span> pedidos
                                </p>
                            </div>
                            <div className="flex-1 flex justify-between sm:justify-end gap-2">
                                <button 
                                    onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                                    disabled={orderPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                                >
                                    ← Anterior
                                </button>
                                <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500">
                                    Página {orderPage} de {Math.ceil(totalOrders / 25)}
                                </span>
                                <button 
                                    onClick={() => setOrderPage(p => p + 1)}
                                    disabled={orderPage * 25 >= totalOrders}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                                >
                                    Siguiente →
                                </button>
                            </div>
                        </div>
                    )}

                  </div>
                </div>
              )}

              
              {activeTab === 'inbox' && (
                <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4">
                  {/* Sidebar de Chats */}
                  <div className={`w-full md:w-1/3 border-r border-gray-200 flex-col bg-gray-50 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <h3 className="font-bold text-gray-800 text-lg mb-3">Mensajes</h3>
                        <div className="relative">
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input 
                                type="text" 
                                placeholder="Buscar chat..." 
                                value={chatSearch}
                                onChange={(e) => setChatSearch(e.target.value)}
                                className="w-full bg-gray-100 text-sm text-gray-700 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {chatList.length === 0 ? (
                            <p className="text-sm text-gray-500 p-4 text-center">No hay conversaciones recientes.</p>
                        ) : (() => {
                            const filteredChats = chatList.filter(chat => {
                                const searchTerm = chatSearch.toLowerCase();
                                const name = (chat.customer_name || '').toLowerCase();
                                const phone = (chat.customer_phone || '').toLowerCase();
                                return name.includes(searchTerm) || phone.includes(searchTerm);
                            });
                            
                            if (filteredChats.length === 0) {
                                return <p className="text-sm text-gray-500 p-4 text-center">No se encontraron chats.</p>;
                            }
                            
                            return filteredChats.map(chat => {
                            const phoneStr = chat.customer_phone?.startsWith('+') ? chat.customer_phone : `+${chat.customer_phone}`;
                            const name = chat.customer_name || phoneStr;
                            const initial = chat.customer_name ? chat.customer_name.charAt(0).toUpperCase() : '#';
                            return (
                            <div 
                                key={chat.customer_phone} 
                                onClick={() => { setActiveChat(chat.customer_phone); setMessageLimit(50); }}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition flex items-center gap-3 ${activeChat === chat.customer_phone ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-100 border-l-4 border-l-transparent'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0">
                                    {initial}
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <div className="font-bold text-gray-900 truncate">{name}</div>
                                    <div className="flex justify-between items-center mt-0.5">
                                      {chat.customer_name && <span className="text-[11px] text-gray-400 truncate">{phoneStr}</span>}
                                      <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                                          {new Date(chat.last_activity).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                    </div>
                                </div>
                            </div>
                            )
                        })})()}
                        {chatList.length >= chatListLimit && (
                            <div ref={loadMoreChatsRef} className="h-10 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                  </div>

                  {/* Área de Chat */}
                  <div className={`w-full md:w-2/3 flex-col bg-white relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                    {activeChat ? (
                        <>
                            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10 relative">
                                <div className="flex items-center">
                                    <button onClick={() => setActiveChat(null)} className="md:hidden mr-3 text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-full transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-3 font-bold">
                                        {chatList.find(c => c.customer_phone === activeChat)?.customer_name ? chatList.find(c => c.customer_phone === activeChat).customer_name.charAt(0).toUpperCase() : '#'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{chatList.find(c => c.customer_phone === activeChat)?.customer_name || `+${activeChat.replace('+', '')}`}</h3>
                                        <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> En línea (WhatsApp)</p>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={async () => {
                                        const newStatus = chatStatus === 'bot' ? 'humano' : 'bot';
                                        setChatStatus(newStatus);
                                        await fetch(\/tenant/\/chats/\/toggle, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: newStatus })
                                        });
                                    }}
                                    className={`ml-4 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-colors ${chatStatus === 'bot' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300 animate-pulse'}`}
                                    title="Click para alternar entre Bot y Humano"
                                >
                                    {chatStatus === 'bot' ? '🤖 Bot Activo' : '👤 Humano (Bot Pausado)'}
                                </button>

                                {/* Order Context Badge */}
                                {chatLatestOrder && (
                                    <div 
                                        onClick={() => setShowChatOrderDetails(!showChatOrderDetails)}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg transition"
                                    >
                                        <div className="hidden sm:flex flex-col items-end mr-1">
                                            <span className="text-xs text-gray-500 font-medium leading-tight">Último Pedido</span>
                                            <span className="text-xs text-gray-400">{new Date(chatLatestOrder.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize flex items-center gap-1.5 shadow-sm border ${
                                            chatLatestOrder.status === 'completado' ? 'bg-green-50 text-green-700 border-green-200' :
                                            chatLatestOrder.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' :
                                            chatLatestOrder.status === 'en_proceso' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                            <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                            <span className="hidden sm:inline">{chatLatestOrder.status.replace('_', ' ')}</span>
                                            <svg className={`w-3.5 h-3.5 opacity-70 transform transition-transform ${showChatOrderDetails ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Mini-Panel de Detalles del Pedido (Modal Flotante) */}
                            {showChatOrderDetails && chatLatestOrder && (
                                <div className="absolute top-20 right-4 left-4 sm:left-auto sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in">
                                    {/* Modal Header: Title + Status Action + Close */}
                                    <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100 bg-white">
                                        <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                            Resumen
                                        </h4>
                                        
                                        <div className="flex items-center gap-3">
                                            {/* Compact Status Selector in Header */}
                                            <div className="relative group">
                                                <select 
                                                    value={chatLatestOrder.status}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value;
                                                        setChatLatestOrder({ ...chatLatestOrder, status: newStatus });
                                                        try {
                                                            await fetch(`${API_URL}/orders/${chatLatestOrder.id}/status`, {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ status: newStatus })
                                                            });
                                                        } catch (err) { console.error(err); }
                                                    }}
                                                    className={`appearance-none text-[11px] font-bold rounded-full border pl-3 pr-7 py-1 cursor-pointer outline-none transition-all ${
                                                        chatLatestOrder.status === 'completado' ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' :
                                                        chatLatestOrder.status === 'cancelado' ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' :
                                                        chatLatestOrder.status === 'en_proceso' ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' :
                                                        'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                                    }`}
                                                >
                                                    <option value="pendiente">Pendiente</option>
                                                    <option value="en_proceso">En Proceso</option>
                                                    <option value="completado">Completado</option>
                                                    <option value="cancelado">Cancelado</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                                                    <svg className={`w-3.5 h-3.5 ${
                                                        chatLatestOrder.status === 'completado' ? 'text-green-500' :
                                                        chatLatestOrder.status === 'cancelado' ? 'text-red-500' :
                                                        chatLatestOrder.status === 'en_proceso' ? 'text-blue-500' :
                                                        'text-yellow-500'
                                                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            <button onClick={() => setShowChatOrderDetails(false)} className="text-gray-400 hover:text-gray-900 transition">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-0">
                                        {/* Items Section */}
                                        <div className="p-5 border-b border-gray-50 bg-white">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Artículos</h5>
                                            <ul className="space-y-3">
                                                {(() => {
                                                    try {
                                                        const items = typeof chatLatestOrder.items === 'string' ? JSON.parse(chatLatestOrder.items) : chatLatestOrder.items;
                                                        if (!Array.isArray(items) || items.length === 0) return <li className="text-gray-400 italic text-sm">Sin artículos</li>;
                                                        return items.map((i, idx) => (
                                                            <li key={idx} className="flex justify-between items-start">
                                                                <div className="flex gap-3">
                                                                    <div className="mt-0.5 bg-gray-100 text-gray-500 rounded text-xs font-bold px-1.5 py-0.5 h-max border border-gray-200">
                                                                        x{i.quantity || i.qty || 1}
                                                                    </div>
                                                                    <span className="font-medium text-gray-800 text-sm">{i.product || i.name || 'Artículo Desconocido'}</span>
                                                                </div>
                                                            </li>
                                                        ));
                                                    } catch(e) { return <li className="text-red-400 text-sm">Error leyendo items</li>; }
                                                })()}
                                            </ul>
                                        </div>

                                        {/* Address Section */}
                                        <div className="p-5 bg-gray-50">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Envío a</h5>
                                            <div className="flex items-start justify-between gap-3 text-sm text-gray-600">
                                                <div className="flex items-start gap-2">
                                                    <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                                    <span className="leading-relaxed">{chatLatestOrder.delivery_address || 'No especificada'}</span>
                                                </div>
                                                {chatLatestOrder.delivery_address && (
                                                    <button 
                                                        onClick={(e) => {
                                                            navigator.clipboard.writeText(chatLatestOrder.delivery_address);
                                                            const btn = e.currentTarget;
                                                            const originalHTML = btn.innerHTML;
                                                            btn.innerHTML = '<svg class="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>';
                                                            btn.classList.add('border-green-300', 'bg-green-50');
                                                            setTimeout(() => {
                                                                btn.innerHTML = originalHTML;
                                                                btn.classList.remove('border-green-300', 'bg-green-50');
                                                            }, 1500);
                                                        }}
                                                        title="Copiar dirección"
                                                        className="flex-shrink-0 text-gray-400 hover:text-gray-900 bg-white border border-gray-200 hover:border-indigo-300 rounded-md p-1.5 shadow-sm transition-all focus:outline-none active:scale-95"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] custom-scrollbar flex flex-col-reverse gap-4">
                                <div ref={bottomAnchorRef} className="h-1 flex-shrink-0" />
                                {[...chatMessages].reverse().map(msg => (
                                    <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-xl shadow-sm relative ${msg.message_type === 'image' ? 'p-1' : 'px-4 py-2'} ${msg.direction === 'outbound' ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                            {msg.message_type === 'image' ? (
                                                msg.content && msg.content.startsWith('http') ? (
                                                    <img onClick={() => { setModalImage(msg.content); setImageZoom(1); }} src={msg.content} alt="Imagen" className="rounded-[8px] max-w-full h-auto object-cover max-h-72 block cursor-pointer hover:opacity-95 transition-opacity" />
                                                ) : (
                                                    <div className="text-sm text-gray-500 italic">🖼️ Imagen enviada</div>
                                                )
                                            ) : msg.message_type === 'audio' ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-gray-900">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path></svg>
                                                        <span className="text-xs font-bold uppercase tracking-wider">Audio Transcrito</span>
                                                    </div>
                                                    <p className="text-sm text-gray-800 italic leading-relaxed mt-1">"{msg.content}"</p>
                                                </div>
                                            ) : msg.message_type === 'interactive' ? (
                                                <div className="text-sm font-semibold text-gray-700 bg-gray-100 p-2 rounded border border-gray-200">{msg.content} <span className="text-xs block text-gray-400 font-normal mt-1">(Menú Interactivo)</span></div>
                                            ) : (
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                                            )}
                                            <div className="text-xs text-gray-400 text-right mt-1 flex justify-end items-center gap-1">
                                                {new Date(msg.created_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                                {msg.direction === 'outbound' && (
                                                    msg.delivery_status === 'read' ? (
                                                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l5 5l10 -10" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12l5 5m5 -5l5 -5" /></svg>
                                                    ) : msg.delivery_status === 'delivered' ? (
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l5 5l10 -10" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12l5 5m5 -5l5 -5" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12l5 5l10 -10" /></svg>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {chatMessages.length >= messageLimit && (
                                    <div ref={loadMoreMessagesRef} className="h-10 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            
                            {showScrollBottomBtn && (
                                <button 
                                    onClick={() => bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                    className="absolute bottom-20 right-6 bg-white text-gray-500 hover:text-gray-700 p-2.5 rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-all z-20 flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                </button>
                            )}

                            <div className="p-3 bg-gray-100 border-t border-gray-200 z-10 relative">
                                <form onSubmit={handleSendReply} className="flex gap-2 bg-white rounded-full p-1 pl-4 shadow-sm border border-gray-300 items-center">
                                    <input 
                                        type="text" 
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        placeholder="Escribe un mensaje..."
                                        className="flex-1 outline-none bg-transparent text-sm"
                                    />
                                    <button type="submit" disabled={!replyText.trim()} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-8 text-center">
                            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                            <h3 className="text-xl font-bold text-gray-500 mb-2">Bandeja de Entrada</h3>
                            <p className="text-sm max-w-sm">Selecciona una conversación a la izquierda para empezar a chatear o ver el historial del bot.</p>
                        </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'configuracion' && (
                <div className="max-w-4xl mx-auto mt-8">
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Configuración</h2>
                  
                  <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Conecta tu WhatsApp Business</h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">Vincula tu número de negocio usando la conexión oficial de Meta. Podrás seguir usando la app de WhatsApp Business en tu celular mientras nuestro bot responde por ti automáticamente.</p>
                        
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left">
                            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Beneficios de la Coexistencia
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li className="flex gap-2"><span>✅</span> Mantienes tu celular conectado.</li>
                                <li className="flex gap-2"><span>✅</span> Historial de chats intacto en tu app.</li>
                                <li className="flex gap-2"><span>✅</span> Cero riesgo de bloqueos (100% Oficial).</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex-1 w-full flex flex-col justify-center">
                        {tenantInfo && tenantInfo.whatsapp_token ? (
                            <div className="bg-green-50 border border-green-200 text-green-800 font-bold p-6 rounded-xl flex flex-col items-center gap-2 text-center">
                                <svg className="w-12 h-12 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                ¡Cuenta Conectada y Activa!
                                <p className="text-sm font-normal mt-1 text-green-700">El bot está listo para recibir mensajes.</p>
                                <button onClick={() => alert("Para desconectar, hazlo desde tu app de WhatsApp Business en Configuración > Herramientas para la empresa > Meta.")} className="mt-4 text-xs underline text-green-600 hover:text-green-800">¿Cómo desconectar?</button>
                            </div>
                        ) : (
                            <button onClick={handleMetaLogin} disabled={loading} className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-4 px-6 rounded-xl shadow-lg transition flex items-center justify-center gap-3 text-lg">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                {loading ? 'Cargando...' : 'Conectar con Facebook'}
                            </button>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'afiliados' && (
                  <div className="max-w-5xl mx-auto mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-900">Programa de Partners</h2>
                            <p className="text-sm text-gray-500 mt-1">Gana comisiones recurrentes por cada cliente que refieras a nuestra plataforma.</p>
                        </div>
                        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">En Construcción 🚧</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-sm font-bold text-gray-500 mb-1">Total Referidos</p>
                            <p className="text-4xl font-extrabold text-gray-900">0</p>
                            <p className="text-xs text-gray-400 mt-2">Negocios activos usando tu código</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-sm font-bold text-gray-500 mb-1">Comisiones Pendientes</p>
                            <p className="text-4xl font-extrabold text-amber-500">0.00 USD</p>
                            <p className="text-xs text-gray-400 mt-2">Próximo pago a fin de mes</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-sm font-bold text-gray-500 mb-1">Total Pagado</p>
                            <p className="text-4xl font-extrabold text-green-500">0.00 USD</p>
                            <p className="text-xs text-gray-400 mt-2">Ganancias históricas</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-50"></div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 relative z-10">Tu Enlace de Afiliado</h3>
                        <p className="text-sm text-gray-600 mb-4 relative z-10">Comparte este enlace con tus prospectos. Si se registran usándolo, recibirás una comisión mensual mientras mantengan su suscripción activa.</p>
                        
                        <div className="flex flex-col md:flex-row gap-3 relative z-10">
                            <input type="text" readOnly value="https://saas-bot.neofenix.dev/registro?ref=PROXIMAMENTE" className="flex-1 bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none" />
                            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 px-6 rounded-lg transition-colors cursor-not-allowed">
                                Copiar Enlace
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">Tus Clientes Referidos</h3>
                        </div>
                        <div className="p-12 text-center flex flex-col items-center justify-center">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <h4 className="text-gray-500 font-semibold">Módulo en construcción</h4>
                            <p className="text-gray-400 text-sm mt-2 max-w-sm">Próximamente podrás ver aquí la lista de negocios que han ingresado con tu enlace y las comisiones generadas.</p>
                        </div>
                    </div>
                  </div>
              )}

              {activeTab === 'productos' && (
              <>
                {/* Cabecera del Módulo */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                  <div>
                      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <svg className="w-7 h-7 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        Mi Catálogo Virtual
                      </h1>
                      <p className="text-gray-500 mt-1 text-sm">Administra los productos de tu negocio. Los cambios se reflejan en tiempo real en WhatsApp.</p>
                  </div>
                  <button onClick={() => { setEditProductId(null); setFormData({name:'', description:'', price:''}); setShowModal(true); }} className="mt-4 md:mt-0 w-full md:w-auto bg-black text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center md:justify-start gap-2 text-sm">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                      Nuevo Producto
                  </button>
                </div>
              </>
            )}

      {/* SECCIÓN IA (Solo visible si es Nivel 2 o 3) */}
      {activeTab === 'chatbots' && tenantInfo && tenantInfo.bot_tier >= 2 && (
          <div className="mb-10 relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tarjeta 1: Personalidad (Izquierda) */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                      <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <h2 className="text-lg font-bold text-gray-900">Personalidad del Agente</h2>
                      </div>
                      <p className="text-gray-500 text-xs mb-4">Instrucciones de comportamiento, tono y límites.</p>
                      <textarea 
                          value={systemPrompt} 
                          onChange={e => setSystemPrompt(e.target.value)} 
                          className="w-full border border-gray-200 p-4 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50 resize-y text-gray-700 text-sm font-mono leading-relaxed" 
                          rows="18"
                          placeholder="Instrucciones para el Bot..."
                      ></textarea>
                  </div>

                  {/* Tarjeta 2: Base de Conocimiento (Derecha) */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                      <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <h2 className="text-lg font-bold text-gray-900">Base de Conocimiento</h2>
                      </div>
                      <p className="text-gray-500 text-xs mb-5">Agrega preguntas comunes y sus respuestas. La IA nunca inventará datos.</p>
                      
                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                          {faqs.map((faq, index) => (
                              <div key={index} className="flex flex-col gap-2 bg-white p-4 rounded-lg border border-gray-200 relative group hover:border-gray-400 transition shadow-sm">
                                  <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'faq', index: index })} className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm" title="Eliminar">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                  
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Pregunta</label>
                                      <input type="text" value={faq.q} onChange={e => { const newFaqs = [...faqs]; newFaqs[index].q = e.target.value; setFaqs(newFaqs); }} className="w-full border-b border-gray-200 pb-1 outline-none focus:border-black bg-transparent text-sm font-medium" placeholder="Ej: ¿Cuáles son las formas de pago?" />
                                  </div>
                                  
                                  <div className="mt-1">
                                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Respuesta</label>
                                      <textarea value={faq.a} onChange={e => { const newFaqs = [...faqs]; newFaqs[index].a = e.target.value; setFaqs(newFaqs); }} className="w-full border border-gray-200 p-2 rounded-md outline-none focus:border-black bg-gray-50 resize-y text-sm" rows="3" placeholder="Ej: Aceptamos pago contra entrega..."></textarea>
                                  </div>
                              </div>
                          ))}
                          <button onClick={() => setFaqs([...faqs, { q: '', a: '' }])} className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 font-semibold hover:bg-gray-50 hover:border-gray-400 transition flex justify-center items-center gap-2 text-sm">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg> Añadir Pregunta
                          </button>
                      </div>
                  </div>
              </div>

              {/* Botón de Guardar General */}
              <div className="flex justify-center mt-8 sticky bottom-6 z-10">
                  <button onClick={handleSaveConfig} disabled={savingPrompt} className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition shadow-xl flex items-center gap-2 transform hover:scale-105 text-sm border border-gray-700">
                      {savingPrompt ? 'Guardando...' : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          Guardar Configuración
                        </>
                      )}
                  </button>
              </div>
          </div>
      )}

      {/* SECCIÓN MENÚ RÍGIDO (Solo visible si es Nivel 1) */}
      {activeTab === 'chatbots' && tenantInfo && tenantInfo.bot_tier === 1 && (
          <div className="bg-gray-100 p-6 rounded-2xl border border-gray-300 shadow-sm mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">📱 Configuración de Menú Principal (Nivel 1)</h2>
              
              <label className="block text-sm font-bold text-gray-700 mb-1 mt-4">Mensaje de Saludo</label>
              <textarea value={tier1Greeting} onChange={e => setTier1Greeting(e.target.value)} className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" rows="2" placeholder="Ej: ¡Hola! Gracias por comunicarte con nosotros..."></textarea>
              
              <div className="mt-6 border-t pt-4">
                  <h3 className="font-bold text-gray-700 mb-2">Opciones del Menú (Botones)</h3>
                  <div className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-sm mb-3 font-medium">1. 🛍️ Ver Productos (Fijo - Abre el catálogo automáticamente)</div>
                  
                  {tier1Menu.map((m, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-3 mb-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm relative">
                          <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'menu', index: idx })} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold hover:bg-red-600">✕</button>
                          <div className="flex-1">
                              <label className="text-xs font-bold text-gray-500">Título del Botón</label>
                              <input type="text" value={m.title} maxLength="24" onChange={e => { let nm = [...tier1Menu]; nm[idx].title = e.target.value; setTier1Menu(nm); }} className="w-full border p-2 rounded outline-none text-sm" placeholder="Ej: Enfermedades" />
                          </div>
                                                      <div className="flex-[2]">
                                <label className="text-xs font-bold text-gray-500">Respuesta del Bot</label>
                                <input type="text" value={m.response} onChange={e => { let nm = [...tier1Menu]; nm[idx].response = e.target.value; setTier1Menu(nm); }} className="w-full border p-2 rounded outline-none text-sm" placeholder="El texto que el bot responderá al tocar este botón..." />
                                
                                <div className="mt-2 flex items-center gap-2">
                                    <label className="text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 cursor-pointer px-3 py-1.5 rounded flex items-center gap-1 transition">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        Adjuntar Imagen
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUploadMenu(idx, e.target.files[0])} />
                                    </label>
                                    {m.image_url && (
                                        <div className="relative group">
                                            <img src={m.image_url} alt="Adjunto" className="w-8 h-8 object-cover rounded border" />
                                            <button onClick={() => { let nm = [...tier1Menu]; delete nm[idx].image_url; setTier1Menu(nm); }} className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-xs font-bold md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center transition">X</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                      </div>
                  ))}
                  <button onClick={handleAddMenu} className="mt-2 text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-bold text-gray-700 transition">+ Añadir Opción</button>
              </div>

              <div className="flex justify-end mt-4">
                  <button onClick={handleSaveConfig} disabled={savingPrompt} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow">
                      {savingPrompt ? 'Guardando...' : 'Guardar Menú'}
                  </button>
              </div>
          </div>
      )}
      
      {activeTab === 'productos' && (() => {
        const filteredProducts = productos.filter(p => (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.description || '').toLowerCase().includes(productSearch.toLowerCase()));
        const ITEMS_PER_PAGE = 30;
        const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
        const paginatedProducts = filteredProducts.slice((productPage - 1) * ITEMS_PER_PAGE, productPage * ITEMS_PER_PAGE);

        return (
            <div className="space-y-6">
                {/* Search Bar */}
                {productos.length > 0 && (
                    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input 
                            type="text" 
                            placeholder="Buscar productos por nombre o descripción..." 
                            value={productSearch}
                            onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }}
                            className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                        />
                        {productSearch && (
                            <button onClick={() => { setProductSearch(''); setProductPage(1); }} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                )}

                {productos.length === 0 ? (
                    <div className="bg-white p-16 text-center rounded-2xl border-2 border-dashed border-gray-300">
                        <h3 className="text-2xl font-bold text-gray-600 mb-2">Catálogo vacío</h3>
                        <p className="text-gray-500">Haz clic en el botón oscuro para agregar el primer producto a tu tienda virtual.</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
                        <p className="text-gray-500">No se encontraron productos que coincidan con tu búsqueda.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                            {paginatedProducts.map(p => (
                                <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 relative group flex flex-col h-full hover:-translate-y-1">
                                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button onClick={() => handleEditProduct(p)} className="bg-white/90 backdrop-blur-sm text-gray-700 border border-gray-200/50 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm hover:bg-white hover:text-gray-900 transition-colors" title="Editar Producto">
                                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(p.id)} className="bg-red-500/90 backdrop-blur-sm text-white w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors" title="Eliminar Producto">
                                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>

                                    <div 
                                        onClick={() => { if(p.image_url) { setModalImage(p.image_url); setImageZoom(1); } }}
                                        className="relative w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-50 cursor-pointer"
                                    >
                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-in-out" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                            <div className="bg-black/30 backdrop-blur-sm p-2 md:p-3 rounded-full text-white shadow-lg">
                                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 md:p-4 flex flex-col flex-grow bg-white">
                                        <h3 className="font-bold text-[13px] md:text-[15px] leading-snug text-gray-900 line-clamp-2 pr-4 md:pr-0">{p.name}</h3>
                                        <p className="text-[11px] md:text-sm text-gray-500 mt-1 md:mt-2 line-clamp-2 leading-relaxed flex-grow">{p.description}</p>
                                        <div className="mt-3 md:mt-4 pt-3 flex justify-between items-center border-t border-gray-100">
                                            <span className="text-[15px] md:text-lg font-black text-gray-900 tracking-tight">Q{p.price}</span>
                                            <span className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 border border-green-200/50 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full">En stock</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-8 pt-4">
                                <button 
                                    onClick={() => setProductPage(p => Math.max(1, p - 1))}
                                    disabled={productPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="text-sm font-semibold text-gray-700">
                                    Página {productPage} de {totalPages}
                                </span>
                                <button 
                                    onClick={() => setProductPage(p => Math.min(totalPages, p + 1))}
                                    disabled={productPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
      })()}

            {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 max-h-[95vh] overflow-y-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-gray-900">{editProductId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                <form onSubmit={handleSubmit}>
                    
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Imagen del Producto</label>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 text-gray-700 hover:file:bg-gray-200" />
                        {formData.image_url && <img src={formData.image_url} alt="preview" className="mt-2 h-20 w-20 object-cover rounded-lg border" />}
                    </div>

                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nombre del Producto</label>
                    <input type="text" required maxLength="24" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 mb-5 outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm text-sm" placeholder="Ej: Pizza Familiar" />
                    
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Precio de Venta</label>
                    <div className="relative mb-5">
                        <span className="absolute left-2 top-2 font-bold text-gray-500 text-sm">Q</span>
                        <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 pl-6 outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm text-sm font-medium" placeholder="99.00" />
                    </div>

                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Descripción para WhatsApp</label>
                    <textarea required maxLength="100" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-200 p-3 mb-6 rounded-lg outline-none focus:border-black bg-gray-50 resize-none text-sm" placeholder="Incluye ingredientes y detalles..." rows="3"></textarea>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-5 py-2.5 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 transition text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-black text-white rounded-xl font-semibold shadow-md hover:bg-gray-800 transition flex items-center justify-center gap-2 text-sm">
                            {loading ? 'Guardando...' : (editProductId ? 'Guardar Cambios' : '🚀 Publicar')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Confirmación Eliminar */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setDeleteConfirm({ isOpen: false, type: null, index: null })}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 transform transition-all text-center" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">¿Eliminar {deleteConfirm.type === 'menu' ? 'opción' : (deleteConfirm.type === 'faq' ? 'pregunta' : 'producto')}?</h3>
                <p className="text-gray-500 text-sm mb-6 px-2">Esta acción no se puede deshacer y se eliminará {deleteConfirm.type === 'producto' ? 'de tu catálogo de WhatsApp inmediatamente.' : 'de la configuración de tu bot de WhatsApp.'}</p>
                <div className="flex gap-3 w-full">
                    <button onClick={() => setDeleteConfirm({ isOpen: false, type: null, index: null })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition">Cancelar</button>
                    <button onClick={async () => {
                        if (deleteConfirm.type === 'menu') {
                            let nm = [...tier1Menu]; nm.splice(deleteConfirm.index, 1); setTier1Menu(nm);
                        } else if (deleteConfirm.type === 'faq') {
                            setFaqs(faqs.filter((_, i) => i !== deleteConfirm.index));
                        } else if (deleteConfirm.type === 'producto') {
                            try {
                                await fetch(`${API_URL}/productos/${deleteConfirm.index}`, { method: 'DELETE' });
                                fetchData();
                            } catch(err) { console.error(err); }
                        }
                        setDeleteConfirm({ isOpen: false, type: null, index: null });
                    }} className="flex-1 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 text-white font-bold py-3 rounded-xl transition">Sí, eliminar</button>
                </div>
            </div>
        </div>
      )}

          </div>
        </div>
      </div>

      {/* Image Modal Lightbox */}
      {modalImage && (
          <div 
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
              onClick={() => { setModalImage(null); setImageZoom(1); setImagePan({x:0, y:0}); }}
          >
              <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
                  <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-semibold tracking-wider">
                      {(imageZoom * 100).toFixed(0)}%
                  </div>
                  <button 
                      className="text-white hover:text-gray-300 p-2 bg-black/50 rounded-full transition-colors"
                      onClick={(e) => { e.stopPropagation(); setImageZoom(s => Math.min(s + 0.5, 4)); }}
                  >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                  </button>
                  <button 
                      className="text-white hover:text-gray-300 p-2 bg-black/50 rounded-full transition-colors"
                      onClick={(e) => { e.stopPropagation(); setImageZoom(s => { const newZoom = Math.max(s - 0.5, 0.5); if(newZoom <= 1) setImagePan({x:0,y:0}); return newZoom; }); }}
                  >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                  </button>
                  <button 
                      className="text-white hover:text-red-400 p-2 bg-black/50 rounded-full transition-colors ml-4"
                      onClick={() => { setModalImage(null); setImageZoom(1); setImagePan({x:0, y:0}); }}
                  >
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
              
              <div 
                  className={`w-full h-full overflow-hidden flex items-center justify-center ${imageZoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  onMouseDown={(e) => {
                      if (imageZoom > 1) {
                          e.preventDefault();
                          setIsDraggingImage(true);
                          imageDragRef.current = false;
                          setDragStart({ x: e.clientX - imagePan.x, y: e.clientY - imagePan.y });
                      }
                  }}
                  onMouseMove={(e) => {
                      if (isDraggingImage && imageZoom > 1) {
                          imageDragRef.current = true;
                          setImagePan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                      }
                  }}
                  onMouseUp={() => {
                      setIsDraggingImage(false);
                      setTimeout(() => { imageDragRef.current = false; }, 50);
                  }}
                  onMouseLeave={() => {
                      setIsDraggingImage(false);
                      imageDragRef.current = false;
                  }}
                  onClick={() => { if(!imageDragRef.current) { setModalImage(null); setImageZoom(1); setImagePan({x:0, y:0}); } }}
              >
                  <img 
                      src={modalImage} 
                      alt="Zoomed" 
                      className={`object-contain max-w-[90vw] max-h-[90vh] shadow-xl ${isDraggingImage ? '' : 'transition-transform duration-200'}`}
                      style={{ 
                          transform: `translate(${imagePan.x}px, ${imagePan.y}px) scale(${imageZoom})`, 
                          transformOrigin: 'center'
                      }}
                      onDragStart={(e) => e.preventDefault()}
                      onClick={(e) => {
                          e.stopPropagation();
                          if (imageDragRef.current) return;
                          
                          if (imageZoom >= 4) { setImageZoom(1); setImagePan({x:0, y:0}); }
                          else { setImageZoom(s => Math.min(s + 0.5, 4)); }
                      }}
                      onWheel={(e) => {
                          e.stopPropagation();
                          if (e.deltaY < 0) {
                              setImageZoom(s => Math.min(s + 0.25, 4));
                          } else {
                              setImageZoom(s => {
                                  const newZoom = Math.max(s - 0.25, 0.5);
                                  if (newZoom <= 1) setImagePan({x:0, y:0});
                                  return newZoom;
                              });
                          }
                      }}
                  />
              </div>
          </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<SuperAdminDashboard />} />
        <Route path="/dashboard/:tenantId" element={<ClientDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

