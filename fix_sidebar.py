import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

campaign_sidebar = """
{tenantInfo?.features?.campaigns && (
            <div onClick={() => setActiveTab('campaigns')} className={`${activeTab === 'campaigns' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
              <span className="font-semibold text-sm">Campañas Masivas</span>
            </div>
            )}"""

target = """            <span className="font-semibold text-sm">Bandeja de Entrada</span>
            </div>
            )}"""

if target in code:
    code = code.replace(target, target + "\n" + campaign_sidebar)
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Sidebar button added successfully.")
else:
    print("Target not found.")
