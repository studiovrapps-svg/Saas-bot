import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update the "Nuevo Cliente" button to be full width on mobile
# Old: className="mt-4 md:mt-0 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 font-semibold shadow-sm transition text-sm flex items-center gap-2"
# New: className="mt-4 md:mt-0 w-full md:w-auto bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 font-semibold shadow-sm transition text-sm flex items-center justify-center md:justify-start gap-2"

code = re.sub(
    r'className="mt-4 md:mt-0 bg-black text-white px-5\s*\n*py-2.5 rounded-lg hover:bg-gray-800 font-semibold shadow-sm transition text-sm flex items-center gap-2"',
    'className="mt-4 md:mt-0 w-full md:w-auto bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 font-semibold shadow-sm transition text-sm flex items-center justify-center md:justify-start gap-2"',
    code
)

# 2. Hide the table container on mobile
# Old: <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
# New: <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
code = re.sub(
    r'<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">',
    '<div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">',
    code,
    count=1  # Only the first one which is in SuperAdminDashboard
)

# 3. Inject the Mobile Card UI right after the table's closing tag.
# We need to find where the table container ends.
# It ends with:
#                                       </tbody>
#                                   </table>
#                               </div>
#                           )}
#                       </div>
# We can inject our mobile UI right before the `</>` of the `activeAdminTab === "inquilinos"` block.

mobile_ui = """                      </div>

                      {/* Vista Móvil (Tarjetas) */}
                      <div className="md:hidden flex flex-col gap-4">
                          {filteredClientes.length === 0 ? (
                              <p className="text-gray-500 italic text-center p-8 bg-white rounded-xl border border-gray-200">No hay clientes en esta categoría.</p>
                          ) : (
                              filteredClientes.map(c => (
                                  <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm relative">
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <h3 className="font-bold text-gray-900 text-lg">{c.name}</h3>
                                              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Nivel {c.bot_tier}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                              <span className={`w-2.5 h-2.5 rounded-full ${c.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                              <span className="text-xs font-bold text-gray-700">{c.is_active ? 'Activo' : 'Suspendido'}</span>
                                          </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                          <span className="truncate">{c.email}</span>
                                      </div>
                                      
                                      <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                                          <div>
                                              {c.whatsapp_phone_id && c.whatsapp_token ? (
                                                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-md">Conectado API</span>
                                              ) : (
                                                  <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-bold px-2.5 py-1 rounded-md">Falta API</span>
                                              )}
                                          </div>
                                          <div className="flex gap-2">
                                              <button onClick={() => window.open(`/dashboard/${c.id}`, '_blank')} className="text-gray-500 hover:text-blue-600 p-1.5 rounded bg-gray-50 hover:bg-blue-50 transition" title="Ir al Panel">
                                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                              </button>
                                              <button onClick={() => { setEditData(c); setFormData({name: c.name, email: c.email, password: "", bot_tier: c.bot_tier, template_id: c.template_id || ""}); setShowEditModal(true); }} className="text-gray-500 hover:text-green-600 p-1.5 rounded bg-gray-50 hover:bg-green-50 transition" title="Editar">
                                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                              </button>
                                              <button onClick={() => handleDelete(c.id)} className="text-gray-500 hover:text-red-600 p-1.5 rounded bg-gray-50 hover:bg-red-50 transition" title="Eliminar">
                                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              ))
                          )}"""

# Replace the closing `</div>` of the table container with `</div> + mobile_ui`
code = re.sub(
    r'\s*</tbody>\s*</table>\s*</div>\s*\)\}\s*</div>',
    lambda m: m.group(0) + '\n' + mobile_ui,
    code
)


with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
