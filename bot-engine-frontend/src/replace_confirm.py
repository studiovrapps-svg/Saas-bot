import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Inject the state for deleteConfirm
code = re.sub(
    r'const \[savingPrompt, setSavingPrompt\] = useState\(false\);',
    'const [savingPrompt, setSavingPrompt] = useState(false);\n    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, index: null });',
    code
)

# 2. Update the tier1Menu Delete button
code = re.sub(
    r'onClick=\{\(\) => \{ if\(window\.confirm\("¿Estás seguro de que deseas eliminar esta opción\?"\)\) \{ let nm = \[\.\.\.tier1Menu\]; nm\.splice\(idx,1\); setTier1Menu\(nm\); \} \}\}',
    "onClick={() => setDeleteConfirm({ isOpen: true, type: 'menu', index: idx })}",
    code
)

# 3. Update the FAQs Delete button
code = re.sub(
    r'onClick=\{\(\) => \{ if\(window\.confirm\("¿Estás seguro de que deseas eliminar esta pregunta\?"\)\) setFaqs\(faqs\.filter\(\(\_, i\) => i !== index\)\); \}\}',
    "onClick={() => setDeleteConfirm({ isOpen: true, type: 'faq', index: index })}",
    code
)

# 4. Inject the Custom Delete Modal before the end of ClientDashboard
delete_modal = """
      {/* Modal de Confirmación de Borrado */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 transform transition-all text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">¿Eliminar {deleteConfirm.type === 'menu' ? 'opción' : 'pregunta'}?</h3>
                <p className="text-gray-500 text-sm mb-6 px-2">Esta acción no se puede deshacer y se eliminará de la configuración de tu bot de WhatsApp.</p>
                <div className="flex gap-3 w-full">
                    <button onClick={() => setDeleteConfirm({ isOpen: false, type: null, index: null })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition">Cancelar</button>
                    <button onClick={() => {
                        if (deleteConfirm.type === 'menu') {
                            let nm = [...tier1Menu]; nm.splice(deleteConfirm.index, 1); setTier1Menu(nm);
                        } else if (deleteConfirm.type === 'faq') {
                            setFaqs(faqs.filter((_, i) => i !== deleteConfirm.index));
                        }
                        setDeleteConfirm({ isOpen: false, type: null, index: null });
                    }} className="flex-1 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 text-white font-bold py-3 rounded-xl transition">Sí, eliminar</button>
                </div>
            </div>
        </div>
      )}
"""

code = code.replace(
    '      )}\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}\n\nfunction App() {',
    f'      )}}\n{delete_modal}\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}}\n\nfunction App() {{'
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
