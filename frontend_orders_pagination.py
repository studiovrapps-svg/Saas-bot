import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add new state for orders pagination
target_state = r"const \[orderListLimit, setOrderListLimit\] = useState\(50\);"
replacement_state = """const [orderPage, setOrderPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);"""
code = re.sub(target_state, replacement_state, code)

# 2. Remove loadMoreOrdersRef
target_ref = r"const loadMoreOrdersRef = useRef\(null\);\n"
code = re.sub(target_ref, "", code)

# 3. Remove orders intersection observer
target_observer = r"""\s*useEffect\(\(\) => \{\n\s*const observer = new IntersectionObserver\(\(entries\) => \{\n\s*if \(entries\[0\]\.isIntersecting\) \{\n\s*setOrderListLimit\(prev => prev \+ 50\);\n\s*\}\n\s*\}, \{ rootMargin: "50px", threshold: 0 \}\);\n\s*if \(loadMoreOrdersRef\.current\) observer\.observe\(loadMoreOrdersRef\.current\);\n\s*return \(\) => observer\.disconnect\(\);\n\s*\}, \[orders\.length\]\);"""
code = re.sub(target_observer, "", code)

# 4. Update fetchOrders logic
target_fetch = """  useEffect(() => {
    if (activeTab === 'pedidos') {
      setLoadingOrders(true);
      fetch(`http://localhost:3000/api/tenant/${tenantId}/orders?limit=${orderListLimit}`)
        .then(res => res.json())
        .then(data => {
          setOrders(data);
          setLoadingOrders(false);
        })
        .catch(() => setLoadingOrders(false));
    }
  }, [activeTab, tenantId, orderListLimit]);"""

replacement_fetch = """  useEffect(() => {
    if (activeTab === 'pedidos') {
      setLoadingOrders(true);
      fetch(`http://localhost:3000/api/tenant/${tenantId}/orders?page=${orderPage}&limit=25`)
        .then(res => res.json())
        .then(resData => {
          // Si el backend es viejo devolverá array, si es nuevo devolverá objeto { data, total, page, limit }
          if (Array.isArray(resData)) {
              setOrders(resData);
              setTotalOrders(resData.length);
          } else {
              setOrders(resData.data);
              setTotalOrders(resData.total);
          }
          setLoadingOrders(false);
        })
        .catch(() => setLoadingOrders(false));
    }
  }, [activeTab, tenantId, orderPage]);"""
code = code.replace(target_fetch, replacement_fetch)

# 5. Inject Pagination Footer for Desktop Table
target_table_end = """                            ))}
                        </div>
                        {orders.length >= orderListLimit && (
                            <div ref={loadMoreOrdersRef} className="h-16 flex items-center justify-center w-full">
                                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                </div>
              )}"""

replacement_table_end = """                            ))}
                        </div>
                        
                        {/* Paginación Clásica */}
                        {totalOrders > 0 && (
                            <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                                <div className="hidden sm:block">
                                    <p className="text-sm text-gray-700">
                                        Mostrando del <span className="font-medium">{(orderPage - 1) * 25 + 1}</span> al <span className="font-medium">{Math.min(orderPage * 25, totalOrders)}</span> de <span className="font-medium">{totalOrders}</span> pedidos
                                    </p>
                                </div>
                                <div className="flex-1 flex justify-between sm:justify-end gap-2">
                                    <button 
                                        onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                                        disabled={orderPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                                    >
                                        Anterior
                                    </button>
                                    <button 
                                        onClick={() => setOrderPage(p => p + 1)}
                                        disabled={orderPage * 25 >= totalOrders}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
              )}"""
code = code.replace(target_table_end, replacement_table_end)


with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Orders pagination injected.")
