import re
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_admin_code = '''function SuperAdminDashboard() {
  const [clientes, setClientes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeAdminTab, setActiveAdminTab] = useState('inquilinos');
  const [tenantFilter, setTenantFilter] = useState('activos');
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  const [editData, setEditData] = useState(null);
  const [editTemplateData, setEditTemplateData] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', bot_tier: 1, template_id: '' });
  const [templateFormData, setTemplateFormData] = useState({ name: '', bot_tier: 1, system_prompt: '', business_rules: '[]' });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { 
    if(sessionStorage.getItem('role') !== 'admin') {
        sessionStorage.clear();
        navigate('/');
        return;
    }
    fetchClientes();
    fetchTemplates();
  }, []);

  const fetchClientes = async () => {
    try {
      const res = await fetch(${API_URL}/clientes);
      const data = await res.json();
      setClientes(data);
    } catch (error) { console.error(error); }
  };

  const fetchTemplates = async () => {
      try {
          const res = await fetch(${API_URL}/templates);
          const data = await res.json();
          setTemplates(data);
      } catch (error) { console.error(error); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(${API_URL}/clientes, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', email: '', password: '', bot_tier: 1, template_id: '' });
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
      const res = await fetch(${API_URL}/clientes/, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, 
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
          const res = await fetch(${API_URL}/templates, {
              method: editTemplateData ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...templateFormData, business_rules: rules })
          });
          if (res.ok) {
              setShowTemplateModal(false);
              setTemplateFormData({ name: '', bot_tier: 1, system_prompt: '', business_rules: '[]' });
              setEditTemplateData(null);
              fetchTemplates();
          }
      } catch (error) { console.error(error); }
      setLoading(false);
  };

  const logout = () => { sessionStorage.clear(); navigate('/'); }

  const filteredClientes = clientes.filter(c => tenantFilter === 'activos' ? c.is_active : !c.is_active);

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
          <div onClick={() => setActiveAdminTab('inquilinos')} className={${activeAdminTab === 'inquilinos' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="font-semibold text-sm">Inquilinos</span>
          </div>
          <div onClick={() => setActiveAdminTab('plantillas')} className={${activeAdminTab === 'plantillas' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition}>
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
            {activeAdminTab === 'inquilinos' && (
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
                        <button onClick={() => setTenantFilter('activos')} className={px-4 py-3 text-sm font-bold border-b-2 transition }>
                            Activos
                        </button>
                        <button onClick={() => setTenantFilter('suspendidos')} className={px-4 py-3 text-sm font-bold border-b-2 transition }>
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
                                            <tr key={c.id} className={hover:bg-gray-50 transition }>
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
                                                        <Link to={/dashboard/} className="text-gray-500 hover:text-black transition" title="Ver Catálogo">
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

            {activeAdminTab === 'plantillas' && (
                <>
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Plantillas de IA</h2>
                            <p className="text-gray-500 mt-1 text-sm">Crea configuraciones base (prompts y reglas) para industrias comunes.</p>
                        </div>
                        <button onClick={() => { setEditTemplateData(null); setTemplateFormData({ name: '', bot_tier: 1, system_prompt: '', business_rules: '[]' }); setShowTemplateModal(true); }} className="mt-4 md:mt-0 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 font-semibold shadow-sm transition text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            Nueva Plantilla
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.length === 0 ? (
                            <p className="text-gray-500 italic p-4 col-span-full">No has creado plantillas todavía.</p>
                        ) : (
                            templates.map(t => (
                                <div key={t.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group hover:border-black transition">
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => { setEditTemplateData(t); setTemplateFormData({name: t.name, bot_tier: t.bot_tier, system_prompt: t.system_prompt || '', business_rules: JSON.stringify(t.business_rules) || '[]'}); setShowTemplateModal(true); }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-700">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={async () => { if(window.confirm('¿Borrar plantilla?')) { await fetch(${API_URL}/templates/, {method:'DELETE'}); fetchTemplates(); } }} className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 text-red-600">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 mb-1">{t.name}</h3>
                                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">Nivel {t.bot_tier}</span>
                                    <p className="text-sm text-gray-500 mt-4 line-clamp-3 font-mono">{t.system_prompt || 'Sin prompt base'}</p>
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
                    <select value={formData.template_id} onChange={(e) => setFormData({...formData, template_id: e.target.value})} className="w-full border-b border-gray-200 p-2 mb-5 outline-none focus:border-black bg-transparent text-sm font-semibold text-blue-600">
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
                            {loading ? 'Procesando...' : (
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
                        <input type="text" value={editData.whatsapp_phone_id || ''} onChange={e => setEditData({...editData, whatsapp_phone_id: e.target.value})} className="w-full border border-gray-200 p-2.5 mb-4 rounded-lg bg-white text-sm outline-none focus:border-black" placeholder="Ej: 10423456789" />
                        
                        <label className="block text-[10px] font-bold mb-1 text-gray-500 uppercase tracking-widest">Access Token Permanente</label>
                        <input type="text" value={editData.whatsapp_token || ''} onChange={e => setEditData({...editData, whatsapp_token: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-lg bg-white text-sm outline-none focus:border-black" placeholder="EAAD... " />
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
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
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
                <h2 className="text-xl font-bold mb-6 text-gray-900">{editTemplateData ? 'Editar Plantilla' : 'Nueva Plantilla'}</h2>
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
                            {loading ? 'Guardando...' : 'Guardar Plantilla'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}'''

content = re.sub(r'function SuperAdminDashboard\(\) \{.*?(?=function ClientDashboard\(\) \{)', new_admin_code + '\n\n', content, flags=re.DOTALL)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done replacing SuperAdminDashboard')
