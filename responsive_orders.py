import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target_start = """                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">"""

# Replace `w-full text-left border-collapse` with `w-full text-left border-collapse hidden md:table`
if target_start in code:
    code = code.replace(target_start, target_start.replace('w-full text-left border-collapse', 'w-full text-left border-collapse hidden md:table'))

# Next, we need to insert the mobile UI right after the table is closed.
target_end = """                        </table>
                    </div>
                  </div>"""

mobile_ui = """                        </table>
                        
                        {/* Mobile View: Cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {loadingOrders ? (
                                <div className="p-8 text-center text-gray-500">Cargando pedidos...</div>
                            ) : orders.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No hay pedidos aún.</div>
                            ) : orders.map(order => (
                                <div key={order.id} className="p-4 bg-white hover:bg-gray-50 transition flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="text-sm font-bold text-gray-900">
                                            {order.customer_phone?.startsWith('+') ? order.customer_phone : `+${order.customer_phone}`}
                                        </div>
                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {new Date(order.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <ul className="text-sm text-gray-700 space-y-1">
                                            {(() => {
                                                try {
                                                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                                                    if (!Array.isArray(items)) return <li className="text-gray-400">Sin items</li>;
                                                    return items.map((i, idx) => (
                                                        <li key={idx} className="flex gap-2">
                                                            <span className="text-indigo-500 font-bold">{i.quantity || i.qty}x</span> 
                                                            <span className="font-medium text-gray-800">{i.product || i.name}</span>
                                                        </li>
                                                    ));
                                                } catch(e) { return <li className="text-red-400">Error leyendo items</li>; }
                                            })()}
                                        </ul>
                                    </div>

                                    <div className="text-sm text-gray-600 flex items-start gap-2">
                                        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span className="break-words">{order.delivery_address}</span>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</span>
                                        <select 
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 outline-none cursor-pointer shadow-sm ${
                                                order.status === 'pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                order.status === 'completado' ? 'bg-green-50 text-green-700 border-green-200' :
                                                order.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}
                                        >
                                            <option value="pendiente">Pendiente</option>
                                            <option value="en_proceso">En Proceso</option>
                                            <option value="completado">Completado</option>
                                            <option value="cancelado">Cancelado</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>"""

if target_end in code:
    code = code.replace(target_end, mobile_ui)
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Mobile UI added.")
else:
    print("Target end not found.")
