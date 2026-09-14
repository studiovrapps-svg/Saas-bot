import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = """                          <div className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input type="checkbox" id="killswitch" checked={!editData.is_active} onChange={e => setEditData({...editData, is_active: !e.target.checked})} className="sr-only peer" />
                              <div className="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                          </div>"""

replacement = """                          <label htmlFor="killswitch" className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input type="checkbox" id="killswitch" checked={!editData.is_active} onChange={e => setEditData({...editData, is_active: !e.target.checked})} className="sr-only peer" />
                              <div className="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                          </label>"""

if target in code:
    code = code.replace(target, replacement)
else:
    print("Could not find exact block")

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Done fixing killswitch label")
