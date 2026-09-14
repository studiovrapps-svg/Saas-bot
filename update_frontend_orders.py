import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add state variable for orders
state_pattern = re.compile(r'const \[tenantInfo, setTenantInfo\] = useState\(null\);')
code = state_pattern.sub(r'const [tenantInfo, setTenantInfo] = useState(null);\n  const [orders, setOrders] = useState([]);\n  const [loadingOrders, setLoadingOrders] = useState(false);', code)

# 2. Add useEffect for fetching orders
effect_code = """
  useEffect(() => {
    if (activeTab === 'pedidos') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`http://localhost:3000/api/tenant/${id}/orders`);
      const data = await res.json();
      setOrders(data);
    } catch(e) {
      console.error(e);
    }
    setLoadingOrders(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchOrders();
    } catch(e) {
      console.error(e);
    }
  };
"""
code = code.replace("const handleMetaLogin = () => {", effect_code + "\n  const handleMetaLogin = () => {")

# 3. Add sidebar tab
tab_code = """
            <div onClick={() => setActiveTab('pedidos')} className={`${activeTab === 'pedidos' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <span className="font-semibold text-sm">Pedidos</span>
            </div>
"""
# insert before configuracion
code = code.replace("<div onClick={() => setActiveTab('configuracion')}", tab_code + "            <div onClick={() => setActiveTab('configuracion')}")

# 4. Add render block
render_code = """
              {activeTab === 'pedidos' && (
                <div className="max-w-6xl mx-auto mt-4">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h2>
                      <p className="text-gray-500 text-sm mt-1">Administra las compras realizadas a través del bot.</p>
                    </div>
                    <button onClick={fetchOrders} className="text-sm bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Actualizar
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Resumen</th>
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Dirección</th>
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loadingOrders ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Cargando pedidos...</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No hay pedidos aún.</td></tr>
                                ) : orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 text-sm text-gray-600 align-top">
                                            {new Date(order.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-900 align-top">
                                            +{order.customer_phone}
                                        </td>
                                        <td className="p-4 align-top">
                                            <ul className="text-sm text-gray-700 space-y-1">
                                                {(() => {
                                                    try {
                                                        const items = JSON.parse(order.items);
                                                        return items.map((i, idx) => (
                                                            <li key={idx} className="flex gap-2"><span className="text-gray-400">{i.quantity}x</span> <span>{i.product}</span></li>
                                                        ));
                                                    } catch(e) { return <li>Error leyendo items</li>; }
                                                })()}
                                            </ul>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 align-top max-w-xs truncate" title={order.delivery_address}>
                                            {order.delivery_address}
                                        </td>
                                        <td className="p-4 align-top">
                                            <select 
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                className={`text-xs font-bold px-2 py-1 rounded-full border-2 outline-none cursor-pointer ${
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  </div>
                </div>
              )}
"""

code = code.replace("{activeTab === 'configuracion' && (", render_code + "\n              {activeTab === 'configuracion' && (")

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
