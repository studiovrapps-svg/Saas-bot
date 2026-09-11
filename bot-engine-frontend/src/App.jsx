import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

const API_URL = 'http://localhost:3000/api';

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
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('role', data.role);
        if (data.role === 'admin') navigate('/admin');
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
      <form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 relative overflow-hidden">
        
        {/* Adorno superior sutil */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-black"></div>

        <div className="flex justify-center mb-6 mt-2">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
        </div>
        
        <h1 className="text-2xl font-black mb-1 text-center text-gray-900 tracking-tight">SaaS Bot Engine</h1>
        <p className="text-center text-sm text-gray-500 mb-8 font-medium">Ingresa a tu cuenta para continuar</p>
        
        {error && (
            <div className="bg-red-50 text-red-600 p-3 mb-6 rounded-lg text-sm text-center font-semibold border border-red-100 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
            </div>
        )}
        
        <div className="mb-5">
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Correo Electrónico</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@empresa.com" className="w-full border-b-2 border-gray-100 py-3 outline-none focus:border-black transition-colors bg-transparent text-sm font-medium text-gray-800" />
        </div>
        
        <div className="mb-8">
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Contraseña</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full border-b-2 border-gray-100 py-3 outline-none focus:border-black transition-colors bg-transparent text-sm font-medium text-gray-800" />
        </div>
        
        <button type="submit" className="w-full bg-black text-white p-3.5 rounded-xl hover:bg-gray-800 transition font-bold shadow-lg flex items-center justify-center gap-2 text-sm">
          Iniciar Sesión
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Acceso Administrativo</p>
          <div className="inline-block bg-gray-50 px-4 py-2 rounded-lg text-xs text-gray-600 font-mono border border-gray-100">
            admin@admin.com <br/> admin123
          </div>
        </div>
      </form>
    </div>
  );
}

function SuperAdminDashboard() {
  const [clientes, setClientes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeAdminTab, setActiveAdminTab] = useState("inquilinos");
  const [tenantFilter, setTenantFilter] = useState("activos");
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  const [editData, setEditData] = useState(null);
  const [editTemplateData, setEditTemplateData] = useState(null);
  
  const [formData, setFormData] = useState({ name: "", email: "", password: "", bot_tier: 1, template_id: "" });
  const [templateFormData, setTemplateFormData] = useState({ name: "", bot_tier: 1, system_prompt: "", business_rules: "[]" });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { 
    if(sessionStorage.getItem("role") !== "admin") {
        sessionStorage.clear();
        navigate("/");
        return;
    }
    fetchClientes();
    fetchTemplates();
  }, []);

  const fetchClientes = async () => {
    try {
      const res = await fetch(`${API_URL}/clientes`);
      const data = await res.json();
      setClientes(data);
    } catch (error) { console.error(error); }
  };

  const fetchTemplates = async () => {
      try {
          const res = await fetch(`${API_URL}/templates`);
          const data = await res.json();
          setTemplates(data);
      } catch (error) { console.error(error); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clientes`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: "", email: "", password: "", bot_tier: 1, template_id: "" });
        fetchClientes();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) { console.error(error); }
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
            bot_tier: editData.bot_tier
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchClientes();
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

  const logout = () => { sessionStorage.clear(); navigate("/"); }

  const filteredClientes = clientes.filter(c => tenantFilter === "activos" ? c.is_active : !c.is_active);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-20">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
             <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">SaaS Bot</h1>
              <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Super Admin</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div onClick={() => setActiveAdminTab("inquilinos")} className={`${activeAdminTab === "inquilinos" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="font-semibold text-sm">Inquilinos</span>
          </div>
          <div onClick={() => setActiveAdminTab("plantillas")} className={`${activeAdminTab === "plantillas" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
            <span className="font-semibold text-sm">Plantillas Base</span>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100">
            <button onClick={logout} className="w-full text-left text-gray-500 hover:text-gray-900 hover:bg-gray-50 p-2.5 rounded-lg font-semibold flex items-center gap-3 transition text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Cerrar Sesión
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
            {activeAdminTab === "inquilinos" && (
                <>
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Gestión de Inquilinos</h2>
                            <p className="text-gray-500 mt-1 text-sm">Administra las cuentas de las empresas, suscripciones y conexión a WhatsApp.</p>
                        </div>
                        <button onClick={() => setShowModal(true)} className="mt-4 md:mt-0 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 font-semibold shadow-sm transition text-sm flex items-center gap-2">
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

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                                                        <button onClick={() => { setEditData(c); setShowEditModal(true); }} className="text-gray-500 hover:text-black transition" title="Configurar">
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
                </>
            )}

            {activeAdminTab === "plantillas" && (
                <>
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Plantillas de IA</h2>
                            <p className="text-gray-500 mt-1 text-sm">Crea configuraciones base (prompts y reglas) para industrias comunes.</p>
                        </div>
                        <button onClick={() => { setEditTemplateData(null); setTemplateFormData({ name: "", bot_tier: 1, system_prompt: "", business_rules: "[]" }); setShowTemplateModal(true); }} className="mt-4 md:mt-0 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 font-semibold shadow-sm transition text-sm flex items-center gap-2">
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
        </div>
      </div>
      
      {/* Modales Inquilinos */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <h2 className="text-xl font-bold mb-6 text-gray-900">Registrar Cliente SaaS</h2>
                <form onSubmit={handleCreate}>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Plantilla Base (Opcional)</label>
                    <select value={formData.template_id} onChange={(e) => setFormData({...formData, template_id: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 mb-5 outline-none focus:border-black bg-gray-50 text-sm font-semibold text-blue-600">
                        <option value="">-- Sin Plantilla (Empezar de cero) --</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>

                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nombre Comercial</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border-b border-gray-200 p-2 mb-5 outline-none focus:border-black bg-transparent text-sm" placeholder="Ej: CDS Premium" />
                    
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Correo (Usuario)</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border-b border-gray-200 p-2 mb-5 outline-none focus:border-black bg-transparent text-sm" placeholder="cliente@correo.com" />
                    
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Contraseña Temporal</label>
                    <input type="text" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full border-b border-gray-200 p-2 mb-6 outline-none focus:border-black bg-transparent text-sm" placeholder="123456" />
                    
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Plan de Suscripción</label>
                    <select value={formData.bot_tier} onChange={(e) => setFormData({...formData, bot_tier: Number(e.target.value)})} className="w-full border border-gray-200 p-3 mb-8 rounded-lg outline-none bg-gray-50 text-sm focus:border-black">
                        <option value={1}>Nivel 1 - Menú Básico (Catálogo S3)</option>
                        <option value={2}>Nivel 2 - Flujos Conversacionales (Groq)</option>
                        <option value={3}>Nivel 3 - IA Premium Libre</option>
                    </select>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-semibold text-gray-700 hover:bg-gray-200 transition text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition shadow-md text-sm flex items-center justify-center gap-2">
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
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
                <h2 className="text-xl font-bold mb-6 text-gray-900">Configuración Técnica</h2>
                <form onSubmit={handleEdit}>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nombre Comercial</label>
                    <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full border-b border-gray-200 p-2 mb-5 outline-none focus:border-black bg-transparent text-sm" />
                    
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Plan de Suscripción</label>
                    <select value={editData.bot_tier} onChange={e => setEditData({...editData, bot_tier: Number(e.target.value)})} className="w-full border border-gray-200 p-3 mb-6 rounded-lg outline-none bg-gray-50 text-sm focus:border-black">
                        <option value={1}>Nivel 1 - Menú Básico</option>
                        <option value={2}>Nivel 2 - Flujos IA (Groq)</option>
                        <option value={3}>Nivel 3 - IA Premium Libre</option>
                    </select>

                    <div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            Conexión Meta WhatsApp API
                        </h3>
                        <label className="block text-[10px] font-bold mb-1 text-gray-500 uppercase tracking-widest">Phone ID</label>
                        <input type="text" value={editData.whatsapp_phone_id || ""} onChange={e => setEditData({...editData, whatsapp_phone_id: e.target.value})} className="w-full border border-gray-200 p-2.5 mb-4 rounded-lg bg-white text-sm outline-none focus:border-black" placeholder="Ej: 10423456789" />
                        
                        <label className="block text-[10px] font-bold mb-1 text-gray-500 uppercase tracking-widest">Access Token Permanente</label>
                        <input type="text" value={editData.whatsapp_token || ""} onChange={e => setEditData({...editData, whatsapp_token: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-lg bg-white text-sm outline-none focus:border-black" placeholder="EAAD... " />
                    </div>

                    <div className="mb-8 p-4 border border-red-100 rounded-xl bg-red-50 flex items-center gap-4">
                        <input type="checkbox" id="killswitch" checked={!editData.is_active} onChange={e => setEditData({...editData, is_active: !e.target.checked})} className="w-5 h-5 accent-red-600 cursor-pointer rounded" />
                        <label htmlFor="killswitch" className="cursor-pointer select-none">
                            <span className="font-bold text-red-700 block text-sm">Suspender Servicio (Kill-Switch)</span>
                            <span className="text-xs text-red-500 block mt-0.5">El bot dejará de responder inmediatamente.</span>
                        </label>
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-semibold text-gray-700 hover:bg-gray-200 transition text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition shadow-md text-sm flex items-center justify-center gap-2">
                            {loading ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Modal Plantilla */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
                <h2 className="text-xl font-bold mb-6 text-gray-900">{editTemplateData ? "Editar Plantilla" : "Nueva Plantilla"}</h2>
                <form onSubmit={handleCreateTemplate}>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nombre de la Plantilla</label>
                    <input type="text" required value={templateFormData.name} onChange={(e) => setTemplateFormData({...templateFormData, name: e.target.value})} className="w-full border-b border-gray-200 p-2 mb-5 outline-none focus:border-black bg-transparent text-sm" placeholder="Ej: Clínica Dental Base" />
                    
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Nivel de Bot Recomendado</label>
                    <select value={templateFormData.bot_tier} onChange={(e) => setTemplateFormData({...templateFormData, bot_tier: Number(e.target.value)})} className="w-full border border-gray-200 p-3 mb-6 rounded-lg outline-none bg-gray-50 text-sm focus:border-black">
                        <option value={2}>Nivel 2 - Flujos Conversacionales</option>
                        <option value={3}>Nivel 3 - IA Premium Libre</option>
                    </select>

                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">System Prompt (Personalidad)</label>
                    <textarea value={templateFormData.system_prompt} onChange={(e) => setTemplateFormData({...templateFormData, system_prompt: e.target.value})} className="w-full border border-gray-200 p-3 mb-4 rounded-lg outline-none bg-gray-50 text-xs font-mono resize-none focus:border-black" rows="6" placeholder="Eres un asistente de una clínica..."></textarea>
                    
                    <div className="flex gap-3 mt-4">
                        <button type="button" onClick={() => setShowTemplateModal(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-semibold text-gray-700 hover:bg-gray-200 transition text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition shadow-md text-sm flex items-center justify-center gap-2">
                            {loading ? "Guardando..." : "Guardar Plantilla"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

function ClientDashboard() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [faqs, setFaqs] = useState([{ q: '', a: '' }]);
  const [tier1Greeting, setTier1Greeting] = useState("");
  const [tier1Menu, setTier1Menu] = useState([]);
  const [savingPrompt, setSavingPrompt] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();
  const [formData, setFormData] = useState({ name: '', description: '', price: '' });
  const [imageFile, setImageFile] = useState(null);
  const [editProductId, setEditProductId] = useState(null);
  const [activeTab, setActiveTab] = useState('productos');

  useEffect(() => { 
    if(!sessionStorage.getItem('token')) navigate('/');
    fetchData(); 
  }, [tenantId]);

  const fetchData = async () => {
    try {
      const resP = await fetch(`${API_URL}/productos/${tenantId}`);
      setProductos(await resP.json());
      
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

  const handleDelete = async (id) => {
      if(!window.confirm("¿Seguro que deseas eliminar este producto? Se borrará de WhatsApp inmediatamente.")) return;
      try {
          await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' });
          fetchData();
      } catch(err) { console.error(err); }
  };

  const logout = () => { sessionStorage.clear(); navigate('/'); }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar Izquierdo (Modo Claro/Elegante) */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-20">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-black tracking-tight text-gray-900">SaaS Bot</h1>
          <p className="text-gray-400 text-xs mt-1 font-semibold tracking-wider uppercase">Workspace</p>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div onClick={() => setActiveTab('dashboard')} className={`${activeTab === 'dashboard' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <span className="font-semibold text-sm">Dashboard</span>
          </div>
          <div onClick={() => setActiveTab('chatbots')} className={`${activeTab === 'chatbots' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span className="font-semibold text-sm">Chatbots</span>
          </div>
          <div onClick={() => setActiveTab('productos')} className={`${activeTab === 'productos' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            <span className="font-semibold text-sm">Productos</span>
          </div>
          <div onClick={() => setActiveTab('configuracion')} className={`${activeTab === 'configuracion' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="font-semibold text-sm">Configuración</span>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100">
          {sessionStorage.getItem('role') === 'admin' ? (
            <button onClick={() => navigate('/dashboard')} className="w-full text-left text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2.5 rounded-lg font-semibold flex items-center gap-3 transition text-sm">
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
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            {sessionStorage.getItem('role') === 'admin' && (
                <Link to="/admin" className="text-gray-500 hover:text-black font-semibold text-xs bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition">
                  ← Admin Panel
                </Link>
            )}
            <h2 className="text-sm font-semibold text-gray-800">{tenantInfo?.name || "Cargando..."}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs">
              {tenantInfo?.name ? tenantInfo.name.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
        </div>

        {/* Área de Trabajo (Scroll) */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            
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
                  <button onClick={() => { setEditProductId(null); setFormData({name:'', description:'', price:''}); setShowModal(true); }} className="mt-4 md:mt-0 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 font-semibold shadow-sm transition flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
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
                                  <button onClick={() => setFaqs(faqs.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm" title="Eliminar">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                  
                                  <div>
                                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Pregunta</label>
                                      <input type="text" value={faq.q} onChange={e => { const newFaqs = [...faqs]; newFaqs[index].q = e.target.value; setFaqs(newFaqs); }} className="w-full border-b border-gray-200 pb-1 outline-none focus:border-black bg-transparent text-sm font-medium" placeholder="Ej: ¿Cuáles son las formas de pago?" />
                                  </div>
                                  
                                  <div className="mt-1">
                                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Respuesta</label>
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
                          <button onClick={() => { let nm = [...tier1Menu]; nm.splice(idx,1); setTier1Menu(nm); }} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold hover:bg-red-600">✕</button>
                          <div className="flex-1">
                              <label className="text-xs font-bold text-gray-500">Título del Botón</label>
                              <input type="text" value={m.title} maxLength="24" onChange={e => { let nm = [...tier1Menu]; nm[idx].title = e.target.value; setTier1Menu(nm); }} className="w-full border p-2 rounded outline-none text-sm" placeholder="Ej: Enfermedades" />
                          </div>
                          <div className="flex-[2]">
                              <label className="text-xs font-bold text-gray-500">Respuesta del Bot</label>
                              <input type="text" value={m.response} onChange={e => { let nm = [...tier1Menu]; nm[idx].response = e.target.value; setTier1Menu(nm); }} className="w-full border p-2 rounded outline-none text-sm" placeholder="El texto que el bot responderá al tocar este botón..." />
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
      
      {activeTab === 'productos' && (
        productos.length === 0 ? (
          <div className="bg-white p-16 text-center rounded-2xl border-2 border-dashed border-gray-300">
              <h3 className="text-2xl font-bold text-gray-600 mb-2">Catálogo vacío</h3>
              <p className="text-gray-500">Haz clic en el botón oscuro para agregar el primer producto a tu tienda virtual.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productos.map(p => (
                <div key={p.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 relative group flex flex-col">
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
                        <button onClick={() => handleEditProduct(p)} className="bg-white text-gray-700 border border-gray-200 w-8 h-8 rounded-full flex items-center justify-center shadow hover:bg-gray-100 transition" title="Editar Producto">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow hover:bg-red-600 transition" title="Eliminar Producto">
                            ✕
                        </button>
                    </div>
                    <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition duration-300"></div>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                        <h3 className="font-bold text-lg line-clamp-1 text-gray-800">{p.name}</h3>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 h-10">{p.description}</p>
                        <div className="mt-auto pt-4 flex justify-between items-center border-t mt-4 border-gray-100">
                            <span className="text-xl font-extrabold text-green-600">Q{p.price}</span>
                            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md">En stock</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        )
      )}

      {activeTab === 'dashboard' && (
        <div className="bg-white p-16 text-center rounded-2xl border border-gray-200 shadow-sm mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido a tu Dashboard</h3>
            <p className="text-gray-500">Aquí pronto verás estadísticas de tus chatbots y ventas.</p>
        </div>
      )}

      {activeTab === 'configuracion' && (
        <div className="bg-white p-16 text-center rounded-2xl border border-gray-200 shadow-sm mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Configuración General</h3>
            <p className="text-gray-500">Ajustes de cuenta y preferencias en desarrollo.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <h2 className="text-xl font-bold mb-6 text-gray-900">{editProductId ? 'Editar Producto' : 'Detalles del Producto'}</h2>
                <form onSubmit={handleSubmit}>
                    
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Fotografía {editProductId && '(Opcional)'}</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 mb-5 bg-gray-50 text-center hover:bg-gray-100 transition">
                        <input type="file" accept="image/*" required={!editProductId} ref={fileInputRef} onChange={handleFileChange} className="w-full text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-200 file:text-gray-800 file:font-semibold hover:file:bg-gray-300 cursor-pointer" />
                        {imageFile && <img src={URL.createObjectURL(imageFile)} alt="Vista previa" className="mt-4 mx-auto max-h-32 rounded-lg shadow-sm border border-gray-200" />}
                    </div>

                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nombre del Producto</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border-b border-gray-200 p-2 mb-5 outline-none focus:border-black bg-transparent text-sm" placeholder="Ej: Pizza Familiar" />
                    
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Precio de Venta</label>
                    <div className="relative mb-5">
                        <span className="absolute left-2 top-2 font-bold text-gray-500 text-sm">Q</span>
                        <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border-b border-gray-200 p-2 pl-6 outline-none focus:border-black bg-transparent text-sm font-medium" placeholder="99.00" />
                    </div>

                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Descripción para WhatsApp</label>
                    <textarea required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-200 p-3 mb-6 rounded-lg outline-none focus:border-black bg-gray-50 resize-none text-sm" placeholder="Incluye ingredientes y detalles..." rows="3"></textarea>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-semibold text-gray-700 hover:bg-gray-200 transition text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-black text-white rounded-lg font-semibold shadow-md hover:bg-gray-800 transition flex items-center justify-center gap-2 text-sm">
                            {loading ? 'Guardando...' : (editProductId ? 'Guardar Cambios' : '🚀 Publicar Ahora')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
          </div>
        </div>
      </div>
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
