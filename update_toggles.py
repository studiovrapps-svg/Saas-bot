import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update the editModal in SuperAdmin
edit_modal_section = """                      <div className="bg-blue-50 p-5 rounded-xl mb-6 border border-blue-100">
                          <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-sm">
                              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                              Módulos Extra (Suscripción)
                          </h3>
                          <div className="flex flex-col gap-3">
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={editData.features?.orders !== false} onChange={e => setEditData({...editData, features: {...(editData.features || {}), orders: e.target.checked}})} className="w-4 h-4 accent-blue-600" />
                                  <span className="text-sm font-semibold text-gray-700">Gestor de Pedidos</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={editData.features?.inbox || false} onChange={e => setEditData({...editData, features: {...(editData.features || {}), inbox: e.target.checked}})} className="w-4 h-4 accent-blue-600" />
                                  <span className="text-sm font-semibold text-gray-700">Bandeja Multi-Agente (Live Chat)</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={editData.features?.crm || false} onChange={e => setEditData({...editData, features: {...(editData.features || {}), crm: e.target.checked}})} className="w-4 h-4 accent-blue-600" />
                                  <span className="text-sm font-semibold text-gray-700">CRM Automático</span>
                              </label>
                          </div>
                      </div>

                      <div className="mb-8 p-4 border border-red-100 rounded-xl bg-red-50 flex items-center gap-4">"""

code = code.replace('<div className="mb-8 p-4 border border-red-100 rounded-xl bg-red-50 flex items-center gap-4">', edit_modal_section)

# 2. Update the Sidebar in ClientDashboard to hide tabs conditionally
# The "Pedidos" tab
pedidos_tab = """<div onClick={() => setActiveTab('pedidos')} className={`${activeTab === 'pedidos' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <span className="font-semibold text-sm">Pedidos</span>
            </div>"""

pedidos_tab_conditional = """{tenantInfo?.features?.orders !== false && (
            <div onClick={() => setActiveTab('pedidos')} className={`${activeTab === 'pedidos' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <span className="font-semibold text-sm">Pedidos</span>
            </div>
            )}"""
code = code.replace(pedidos_tab, pedidos_tab_conditional)

# 3. Add Inbox placeholder tab
inbox_tab_conditional = """{tenantInfo?.features?.inbox && (
            <div onClick={() => setActiveTab('inbox')} className={`${activeTab === 'inbox' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <span className="font-semibold text-sm">Bandeja de Entrada</span>
            </div>
            )}"""

code = code.replace(pedidos_tab_conditional, pedidos_tab_conditional + "\n" + inbox_tab_conditional)

# 4. Add Inbox render block
inbox_render = """
              {activeTab === 'inbox' && (
                <div className="bg-white p-16 text-center rounded-2xl border border-gray-200 shadow-sm mt-8">
                    <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Bandeja Multi-Agente</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Este módulo te permite conectar múltiples agentes para responder chats simultáneamente desde esta plataforma.</p>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">Configurar Agentes</button>
                </div>
              )}
"""

code = code.replace("{activeTab === 'configuracion' && (", inbox_render + "\n              {activeTab === 'configuracion' && (")


with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
