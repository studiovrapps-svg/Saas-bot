import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add states for chatListLimit and orderListLimit
state_target = r"const \[chatMessages, setChatMessages\] = useState\(\[\]\);\s*const \[messageLimit, setMessageLimit\] = useState\(50\);"
state_replacement = """const [chatMessages, setChatMessages] = useState([]);
    const [messageLimit, setMessageLimit] = useState(50);
    const [chatListLimit, setChatListLimit] = useState(50);
    const [orderListLimit, setOrderListLimit] = useState(50);
    
    // Observers refs
    const loadMoreMessagesRef = useRef(null);
    const loadMoreChatsRef = useRef(null);
    const loadMoreOrdersRef = useRef(null);

    // Infinite Scroll Observers
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setMessageLimit(prev => prev + 50);
            }
        }, { threshold: 0.1 });
        if (loadMoreMessagesRef.current) observer.observe(loadMoreMessagesRef.current);
        return () => observer.disconnect();
    }, [chatMessages.length]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setChatListLimit(prev => prev + 50);
            }
        }, { threshold: 0.1 });
        if (loadMoreChatsRef.current) observer.observe(loadMoreChatsRef.current);
        return () => observer.disconnect();
    }, [chatList.length]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setOrderListLimit(prev => prev + 50);
            }
        }, { threshold: 0.1 });
        if (loadMoreOrdersRef.current) observer.observe(loadMoreOrdersRef.current);
        return () => observer.disconnect();
    }, [orders.length]);"""

code = re.sub(state_target, state_replacement, code)

# 2. Update fetchChats to use limit
fetchChats_target = r"const res = await fetch\(`http://localhost:3000/api/tenant/\$\{tenantId\}/chats`\);"
fetchChats_replacement = r"const res = await fetch(`http://localhost:3000/api/tenant/${tenantId}/chats?limit=${chatListLimit}`);"
code = re.sub(fetchChats_target, fetchChats_replacement, code)

fetchChats_deps_target = r"\}, \[activeTab, tenantId\]\);"
fetchChats_deps_replacement = r"}, [activeTab, tenantId, chatListLimit]);"
code = re.sub(fetchChats_deps_target, fetchChats_deps_replacement, code)

# 3. Replace the old "Cargar mensajes anteriores" button with an invisible trigger
messages_btn_target = r"\{chatMessages\.length >= messageLimit && \(\s*<div className=\"flex justify-center\">\s*<button.*?>.*?Cargar mensajes anteriores\s*</button>\s*</div>\s*\)\}"
messages_btn_replacement = """{chatMessages.length >= messageLimit && (
                                    <div ref={loadMoreMessagesRef} className="h-10 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                    </div>
                                )}"""
code = re.sub(messages_btn_target, messages_btn_replacement, code, flags=re.DOTALL)

# 4. Update order fetching
fetchOrders_target = """  useEffect(() => {
    if (activeTab === 'pedidos') {
      setLoadingOrders(true);
      fetch(`http://localhost:3000/api/tenant/${tenantId}/orders`)
        .then(res => res.json())
        .then(data => {
          setOrders(data);
          setLoadingOrders(false);
        })
        .catch(() => setLoadingOrders(false));
    }
  }, [activeTab, tenantId]);"""

fetchOrders_replacement = """  useEffect(() => {
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
code = code.replace(fetchOrders_target, fetchOrders_replacement)

# 5. Add loadMoreChatsRef to the sidebar chats list
sidebar_target = r"(\{chatList\.map\(chat => \(.*?\)\)\})"
sidebar_replacement = r"\1\n{chatList.length >= chatListLimit && <div ref={loadMoreChatsRef} className=\"h-10 flex items-center justify-center\"><div className=\"w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin\"></div></div>}"
code = re.sub(sidebar_target, sidebar_replacement, code, flags=re.DOTALL)

# 6. Add loadMoreOrdersRef to the orders table
orders_target = r"(</tbody>\s*</table>\s*</div>)"
orders_replacement = r"\1\n{orders.length >= orderListLimit && <div ref={loadMoreOrdersRef} className=\"h-16 flex items-center justify-center\"><div className=\"w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin\"></div></div>}"
code = re.sub(orders_target, orders_replacement, code, flags=re.DOTALL)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Frontend updated for infinite scroll on chats, orders, and messages.")
