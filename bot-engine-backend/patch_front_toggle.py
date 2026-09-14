import sys

file_path = '../bot-engine-frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state variable
search_state = "const [chatMessages, setChatMessages] = useState([]);"
replace_state = "const [chatMessages, setChatMessages] = useState([]);\n  const [chatStatus, setChatStatus] = useState('bot');"
content = content.replace(search_state, replace_state)

# 2. Fetch session status when chat opens
search_fetch = '''const res2 = await fetch(\/tenant/\/chats/\);
        const data2 = await res2.json();
        setChatMessages(Array.isArray(data2) ? data2 : []);'''
replace_fetch = '''const res2 = await fetch(\/tenant/\/chats/\);
        const data2 = await res2.json();
        setChatMessages(Array.isArray(data2) ? data2 : []);
        
        try {
            const res3 = await fetch(\/tenant/\/chats/\/session);
            const data3 = await res3.json();
            setChatStatus(data3.status || 'bot');
        } catch(e) {}'''
content = content.replace(search_fetch, replace_fetch)

# 3. Add toggle UI in the chat header
search_ui = '''<div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                  {selectedChat.customer_name ? selectedChat.customer_name.charAt(0).toUpperCase() : '#'}
                              </div>
                              <div>
                                  <h3 className="font-bold text-gray-800">{selectedChat.customer_name || 'Desconocido'}</h3>
                                  <p className="text-xs text-gray-500">+{selectedChat.customer_phone}</p>
                              </div>
                          </div>'''
replace_ui = '''<div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                  {selectedChat.customer_name ? selectedChat.customer_name.charAt(0).toUpperCase() : '#'}
                              </div>
                              <div>
                                  <h3 className="font-bold text-gray-800">{selectedChat.customer_name || 'Desconocido'}</h3>
                                  <p className="text-xs text-gray-500">+{selectedChat.customer_phone}</p>
                              </div>
                          </div>
                          <button 
                              onClick={async () => {
                                  const newStatus = chatStatus === 'bot' ? 'humano' : 'bot';
                                  setChatStatus(newStatus);
                                  await fetch(\/tenant/\/chats/\/toggle, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: newStatus })
                                  });
                              }}
                              className={px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-colors \}
                          >
                              {chatStatus === 'bot' ? '?? Bot Activo' : '?? Humano (Bot Pausado)'}
                          </button>'''
content = content.replace(search_ui, replace_ui)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Frontend updated with toggle")
