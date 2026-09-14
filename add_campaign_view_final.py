import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

campaign_view = """
      {/* SECCIÓN CAMPAÑAS MASIVAS */}
      {activeTab === 'campaigns' && tenantInfo && tenantInfo.features?.campaigns && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Campañas Masivas (Broadcasts)</h2>
              <p className="text-gray-500 mb-8">Envía plantillas promocionales a todos tus contactos registrados.</p>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-2">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                      <h3 className="font-bold text-red-800">Advertencia de Costos de Meta</h3>
                  </div>
                  <p className="text-sm text-red-700 ml-9">
                      El envío de plantillas de marketing tiene un costo cobrado directamente por Meta (WhatsApp). 
                      Al disparar esta campaña, se aplicarán los cargos correspondientes a tu método de pago asociado en el Business Manager.
                  </p>
              </div>

              <div className="max-w-xl">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la Plantilla (Pre-aprobada en Meta)</label>
                  <input type="text" id="campaignTemplateName" placeholder="Ej: promo_verano_2026" className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition mb-6" />
                  
                  <button onClick={async () => {
                      const templateName = document.getElementById('campaignTemplateName').value;
                      if (!templateName) return alert('Debes escribir el nombre de la plantilla.');
                      if (!confirm('¿Estás seguro de enviar esta campaña a toda tu base de datos? Esta acción no se puede deshacer.')) return;
                      
                      try {
                          // The param in ClientDashboard is usually tenantId but sometimes id, let's extract it from url or tenantInfo
                          const tId = tenantInfo.id;
                          const res = await fetch(`http://localhost:3000/api/tenant/${tId}/campaigns/send`, {
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
                  }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition flex items-center justify-center gap-3 text-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                      Disparar Campaña Masiva
                  </button>
              </div>
          </div>
      )}
"""

target = """        </div>
      )}

          </div>
        </div>"""

if target in code:
    code = code.replace(target, target + "\n" + campaign_view)
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("View injected")
else:
    print("Target not found")
