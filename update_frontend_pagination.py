import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add state
state_target = "const [chatMessages, setChatMessages] = useState([]);"
state_replacement = """const [chatMessages, setChatMessages] = useState([]);
    const [messageLimit, setMessageLimit] = useState(50);
    const [isInitialLoad, setIsInitialLoad] = useState(true);"""
code = code.replace(state_target, state_replacement)

# 2. Reset limit and initial load on activeChat change
# We can just put this in the activeChat setter or a useEffect, but easier to just add an onClick wrapper in the sidebar or a useEffect.
# The sidebar has onClick={() => setActiveChat(chat.customer_phone)}
sidebar_target = r"onClick=\{\(\) => setActiveChat\(chat\.customer_phone\)\}"
sidebar_replacement = """onClick={() => { setActiveChat(chat.customer_phone); setMessageLimit(50); setIsInitialLoad(true); }}"""
code = re.sub(sidebar_target, sidebar_replacement, code)

# 3. Update fetchMessages
fetch_target = """        const fetchMessages = async () => {
          try {
            const res = await fetch(`http://localhost:3000/api/tenant/${tenantId}/chats/${activeChat}`);
            const data = await res.json();
            setChatMessages(data);
          } catch(e) {}
        };"""
fetch_replacement = """        const fetchMessages = async () => {
          try {
            const res = await fetch(`http://localhost:3000/api/tenant/${tenantId}/chats/${activeChat}?limit=${messageLimit}`);
            const data = await res.json();
            setChatMessages(data);
          } catch(e) {}
        };"""
code = code.replace(fetch_target, fetch_replacement)

# 4. Remove smooth scroll and respect initial load
scroll_target = """  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === 'inbox') {
      setTimeout(scrollToBottom, 50);
    }
  }, [chatMessages.length, activeChat, activeTab]);"""

scroll_replacement = """  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView(smooth ? { behavior: "smooth" } : undefined);
  };

  useEffect(() => {
    if (activeTab === 'inbox') {
      if (isInitialLoad) {
          setTimeout(() => { scrollToBottom(false); setIsInitialLoad(false); }, 50);
      } else {
          // Si el usuario acaba de enviar o recibir un mensaje nuevo (la longitud cambió pero el límite no es responsable)
          // No hacemos scroll forzado si están viendo mensajes viejos, pero como MVP, simplemente bajamos instantáneo.
          setTimeout(() => scrollToBottom(false), 50);
      }
    }
  }, [chatMessages.length, activeChat, activeTab]);"""
code = code.replace(scroll_target, scroll_replacement)

# 5. Add "Cargar mensajes anteriores" button at the top of the messages list
messages_target = """<div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] custom-scrollbar space-y-4">
                              {chatMessages.map(msg => {"""
messages_replacement = """<div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] custom-scrollbar space-y-4">
                              {chatMessages.length >= messageLimit && (
                                  <div className="flex justify-center mb-4">
                                      <button 
                                          onClick={() => setMessageLimit(prev => prev + 50)} 
                                          className="bg-white/80 hover:bg-white text-gray-700 text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition"
                                      >
                                          Cargar mensajes anteriores
                                      </button>
                                  </div>
                              )}
                              {chatMessages.map(msg => {"""
code = code.replace(messages_target, messages_replacement)

# Ensure dependencies in the fetch interval use messageLimit
interval_target = "}, [activeTab, activeChat, tenantId]);"
interval_replacement = "}, [activeTab, activeChat, tenantId, messageLimit]);"
code = code.replace(interval_target, interval_replacement)


with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Frontend updated for pagination and instant scroll.")
