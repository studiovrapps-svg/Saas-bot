import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add state hook
if 'const [unlockApi, setUnlockApi] = useState(false);' not in code:
    code = code.replace('const [showEditModal, setShowEditModal] = useState(false);', 
                        'const [showEditModal, setShowEditModal] = useState(false);\n  const [unlockApi, setUnlockApi] = useState(false);')

# 2. Add setUnlockApi(false) when opening the modal
code = code.replace('setShowEditModal(true);', 'setShowEditModal(true); setUnlockApi(false);')

# 3. Rewrite the API credentials block
old_block = """                    <div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            Conexión Meta WhatsApp API
                        </h3>
                        <label className="block text-[10px] font-bold mb-1 text-gray-500 uppercase tracking-widest">Phone ID</label>
                        <input type="text" value={editData.whatsapp_phone_id || ""} onChange={e => setEditData({...editData, whatsapp_phone_id: e.target.value})} className="w-full font-mono border border-gray-200 p-2.5 mb-4 rounded-lg bg-gray-50 text-sm outline-none focus:border-indigo-500 focus:bg-white transition" placeholder="Ej: 10423456789" />
                        
                        <label className="block text-[10px] font-bold mb-1 text-gray-500 uppercase tracking-widest">Access Token Permanente</label>
                        <input type="text" value={editData.whatsapp_token || ""} onChange={e => setEditData({...editData, whatsapp_token: e.target.value})} className="w-full font-mono border border-gray-200 p-2.5 rounded-lg bg-gray-50 text-sm outline-none focus:border-indigo-500 focus:bg-white transition" placeholder="EAAD... " />
                    </div>"""

new_block = """                    <div className="bg-slate-50 p-5 rounded-xl mb-6 border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z" /></svg>
                                Credenciales de Meta (Protegidas)
                            </h3>
                            {!unlockApi && editData.whatsapp_phone_id && (
                                <button type="button" onClick={() => setUnlockApi(true)} className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition">Modificar</button>
                            )}
                        </div>
                        
                        {(!unlockApi && editData.whatsapp_phone_id) ? (
                            <div className="text-sm text-gray-500 italic flex items-center gap-2 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                Los tokens de WhatsApp están ocultos por seguridad.
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-widest">Phone ID</label>
                                <input type="text" value={editData.whatsapp_phone_id || ""} onChange={e => setEditData({...editData, whatsapp_phone_id: e.target.value})} className="w-full font-mono border border-slate-200 p-2.5 mb-4 rounded-lg bg-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" placeholder="Ej: 10423456789" />
                                
                                <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-widest">Access Token Permanente</label>
                                <input type="password" value={editData.whatsapp_token || ""} onChange={e => setEditData({...editData, whatsapp_token: e.target.value})} className="w-full font-mono border border-slate-200 p-2.5 rounded-lg bg-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" placeholder="EAAD... " />
                            </div>
                        )}
                    </div>"""

code = code.replace(old_block, new_block)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Done locking api fields")
