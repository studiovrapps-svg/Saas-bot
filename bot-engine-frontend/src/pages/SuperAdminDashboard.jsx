import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
                  <h1 class="text-3xl font-black text-indigo-600 tracking-tighter">DYNOVA</h1>
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
              <img src="/logo-dynova.jpeg" alt="Dynova Logo" className="h-20 w-auto object-contain -ml-3 -mt-2 -mb-2" />
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
          <span className="font-bold text-gray-900">Dynova Admin</span>
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
                                <label className="block text-xs font-bold mb-1 text-gray-500 uppercase tracking-wider">ID del Teléfono (Phone ID)</label>
                                <input type="text" autoComplete="off" data-lpignore="true" data-form-type="other" value={editData.whatsapp_phone_id || ""} onChange={e => setEditData({...editData, whatsapp_phone_id: e.target.value})} className="w-full font-mono border border-gray-200 p-2.5 mb-4 rounded-xl bg-gray-50 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm" placeholder="Ej: 10423456789" />
                                
                                <label className="block text-xs font-bold mb-1 text-gray-500 uppercase tracking-wider">Token de Acceso Permanente</label>
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
export default SuperAdminDashboard;