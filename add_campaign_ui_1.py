import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add Campaign Toggle in the Features UI
target_crm_toggle = """<label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-semibold text-gray-700">CRM Automático</span>
                                    <div className="relative inline-flex items-center">
                                        <input type="checkbox" checked={editData.features?.crm || false} onChange={e => setEditData({...editData, features: {...(editData.features || {}), crm: e.target.checked}})} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </div>
                                </label>"""

campaign_toggle = """
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-semibold text-gray-700">Campañas Masivas (Broadcasts)</span>
                                    <div className="relative inline-flex items-center">
                                        <input type="checkbox" checked={editData.features?.campaigns || false} onChange={e => setEditData({...editData, features: {...(editData.features || {}), campaigns: e.target.checked}})} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </div>
                                </label>"""

if target_crm_toggle in code:
    code = code.replace(target_crm_toggle, target_crm_toggle + campaign_toggle)
    print("Added campaign toggle UI")

# 2. Add Sidebar Button
target_sidebar = """{tenantInfo?.features?.inbox && (
                <button onClick={() => setActiveTab('inbox')} className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'inbox' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    Bandeja Multi-Agente
                </button>
            )}"""

campaign_sidebar = """
            {tenantInfo?.features?.campaigns && (
                <button onClick={() => setActiveTab('campaigns')} className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'campaigns' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                    Campañas Masivas
                </button>
            )}"""

if target_sidebar in code:
    code = code.replace(target_sidebar, target_sidebar + campaign_sidebar)
    print("Added campaign sidebar button")

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
