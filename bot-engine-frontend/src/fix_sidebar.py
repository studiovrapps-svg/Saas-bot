import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Inject Sidebar Item
sidebar_item = """            <div onClick={() => setActiveTab('conexion')} className={`${activeTab === 'conexion' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              <span className="font-semibold text-sm">Conexión</span>
            </div>"""

code = re.sub(
    r'(<div onClick=\{\(\) => setActiveTab\(\'configuracion\'\)\}.*?>[\s\S]*?</span>\s*</div>)',
    r'\1\n' + sidebar_item,
    code
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
