import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

campaign_toggle = """
                              <label className="flex items-center justify-between cursor-pointer">
                                  <span className="text-sm font-semibold text-gray-700">Campañas Masivas (Broadcasts)</span>
                                  <div className="relative inline-flex items-center">
                                      <input type="checkbox" checked={editData.features?.campaigns || false} onChange={e => setEditData({...editData, features: {...(editData.features || {}), campaigns: e.target.checked}})} className="sr-only peer" />
                                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                  </div>
                              </label>"""

code = re.sub(r'(<span className="text-sm font-semibold text-gray-700">CRM.*?</div>\s*</div>\s*</label>)', r'\1' + campaign_toggle, code, flags=re.DOTALL)

campaign_sidebar = """
          {tenantInfo?.features?.campaigns && (
              <button onClick={() => setActiveTab('campaigns')} className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'campaigns' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                  Campañas Masivas
              </button>
          )}"""

code = re.sub(r'(Bandeja Multi-Agente\s*</button>\s*\}\)\s*\}?)', r'\1' + campaign_sidebar, code)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Regex replace completed 2")
