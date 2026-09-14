with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the start line
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "activeTab === 'campaigns' && tenantInfo && tenantInfo.features?.campaigns && (" in line:
        start_idx = i
        # Now find the closing )}
        for j in range(i, len(lines)):
            if "      )}" in lines[j] and lines[j].strip() == ")}":
                end_idx = j
                break
        break

if start_idx != -1 and end_idx != -1:
    new_ui = """      {activeTab === 'campaigns' && tenantInfo && tenantInfo.features?.campaigns && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-indigo-50 to-white px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
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
                              <input type="text" id="campaignTemplateName" placeholder="Ej: promo_navidad_2026" className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition mb-4 text-sm bg-white shadow-sm" />
                              
                              <button onClick={async () => {
                                  const templateName = document.getElementById('campaignTemplateName').value;
                                  if (!templateName) return alert('Debes escribir el nombre de la plantilla.');
                                  if (!confirm('¿Estás seguro de enviar esta campaña a toda tu base de datos? Esta acción no se puede deshacer.')) return;
                                  
                                  try {
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
                              }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition flex items-center justify-center gap-2 text-sm">
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
      )}\n"""
    
    lines[start_idx:end_idx+1] = [new_ui]
    
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("UI replaced with line precision")
else:
    print(f"Could not find block indices. start: {start_idx}, end: {end_idx}")
