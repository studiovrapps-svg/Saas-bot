import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

dashboard_and_config = """              {activeTab === 'dashboard' && (
                <div className="bg-white p-16 text-center rounded-2xl border border-gray-200 shadow-sm mt-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido a tu Dashboard</h3>
                    <p className="text-gray-500">Aquí pronto verás estadísticas de tus chatbots y ventas.</p>
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
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
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

              {activeTab === 'productos' && ("""

# Replace `{activeTab === 'productos' && (` in the FIRST matching location
code = code.replace("{activeTab === 'productos' && (", dashboard_and_config, 1)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
