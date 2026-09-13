import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add 'conexion' tab to ClientDashboard navigation
nav_pattern = r'<nav className="flex flex-col md:flex-row gap-2 md:gap-8 mb-8 border-b border-gray-200">\s*<button onClick=\{\(\) => setActiveTab\(\'productos\'\)\}.*?>Catálogo</button>\s*<button onClick=\{\(\) => setActiveTab\(\'chatbots\'\)\}.*?>Configuración del Bot</button>\s*</nav>'
new_nav = """<nav className="flex flex-col md:flex-row gap-2 md:gap-8 mb-8 border-b border-gray-200">
            <button onClick={() => setActiveTab('productos')} className={`pb-3 font-bold text-sm md:text-base border-b-4 transition ${activeTab === 'productos' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Catálogo</button>
            <button onClick={() => setActiveTab('chatbots')} className={`pb-3 font-bold text-sm md:text-base border-b-4 transition ${activeTab === 'chatbots' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Comportamiento del Bot</button>
            <button onClick={() => setActiveTab('conexion')} className={`pb-3 font-bold text-sm md:text-base border-b-4 transition ${activeTab === 'conexion' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-400 hover:text-green-600'}`}>Conexión WhatsApp</button>
        </nav>"""
code = re.sub(r'<nav className="flex flex-col md:flex-row gap-2 md:gap-8 mb-8 border-b border-gray-200">[\s\S]*?</nav>', new_nav, code)


# 2. Add Facebook SDK initialization to ClientDashboard
sdk_init = """    useEffect(() => { 
    if(!sessionStorage.getItem('token')) navigate('/');
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
  }, [tenantId]);"""

code = re.sub(r'useEffect\(\(\) => \{ \n\s*if\(!sessionStorage\.getItem\(\'token\'\)\) navigate\(\'/\'\);\n\s*fetchData\(\); \n\s*\}, \[tenantId\]\);', sdk_init, code)


# 3. Add handleMetaLogin function
meta_func = """    const handleMetaLogin = () => {
        if (!window.FB) return alert("Cargando SDK de Facebook, intenta de nuevo.");
        window.FB.login((response) => {
            if (response.authResponse) {
                const accessToken = response.authResponse.accessToken;
                linkWhatsAppAccount(accessToken);
            } else {
                console.log('El usuario canceló el inicio de sesión.');
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
    };"""

# Insert right after `const logout = ...`
code = code.replace("const logout = () => { sessionStorage.clear(); navigate('/'); }", meta_func + "\n\n    const logout = () => { sessionStorage.clear(); navigate('/'); }")


# 4. Add the 'conexion' tab UI
tab_ui = """        {activeTab === 'conexion' && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto text-center mt-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Conecta tu WhatsApp Business</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">Vincula tu número de negocio usando la conexión oficial de Meta. Podrás seguir usando la app de WhatsApp Business en tu celular mientras nuestro bot responde por ti automáticamente.</p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left mb-8">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Beneficios de la Coexistencia
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex gap-2"><span>✅</span> Mantienes tu celular conectado.</li>
                      <li className="flex gap-2"><span>✅</span> Historial de chats intacto en tu app.</li>
                      <li className="flex gap-2"><span>✅</span> Cero riesgo de bloqueos (100% Oficial).</li>
                  </ul>
              </div>

              {tenantInfo && tenantInfo.whatsapp_token ? (
                  <div className="bg-green-50 border border-green-200 text-green-800 font-bold p-4 rounded-xl flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      ¡Cuenta Conectada y Activa!
                      <p className="text-xs font-normal mt-1 text-green-700">El bot está listo para recibir mensajes.</p>
                  </div>
              ) : (
                  <button onClick={handleMetaLogin} disabled={loading} className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-3 text-lg">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      {loading ? 'Conectando...' : 'Conectar con Facebook'}
                  </button>
              )}
          </div>
        )}"""

# Replace `{activeTab === 'dashboard' && (` to inject our new tab right before it
code = code.replace("{activeTab === 'dashboard' && (", tab_ui + "\n\n        {activeTab === 'dashboard' && (")

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
