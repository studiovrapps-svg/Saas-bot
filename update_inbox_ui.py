import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target_sidebar = """                              {chatList.map((chat, idx) => (
                                  <div 
                                      key={idx} 
                                      onClick={() => setActiveChat(chat.customer_phone)}
                                      className={`p-4 cursor-pointer hover:bg-gray-50 transition border-b border-gray-100 border-l-4 ${activeChat === chat.customer_phone ? 'bg-blue-50/50 border-l-blue-500' : 'border-l-transparent'}`}
                                  >
                                      <div className="font-bold text-gray-900">{chat.customer_phone?.startsWith('+') ? chat.customer_phone : `+${chat.customer_phone}`}</div>
                                      <div className="text-xs text-gray-400 mt-1">
                                          {new Date(chat.last_activity).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                      </div>
                                  </div>
                              ))}"""

replacement_sidebar = """                              {chatList.map((chat, idx) => {
                                  const name = chat.customer_name || (chat.customer_phone?.startsWith('+') ? chat.customer_phone : `+${chat.customer_phone}`);
                                  const initial = chat.customer_name ? chat.customer_name.charAt(0).toUpperCase() : '#';
                                  
                                  return (
                                  <div 
                                      key={idx} 
                                      onClick={() => setActiveChat(chat.customer_phone)}
                                      className={`p-4 cursor-pointer hover:bg-gray-50 transition border-b border-gray-100 border-l-4 flex items-center gap-3 ${activeChat === chat.customer_phone ? 'bg-blue-50/50 border-l-blue-500' : 'border-l-transparent'}`}
                                  >
                                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0">
                                          {initial}
                                      </div>
                                      <div className="overflow-hidden flex-1">
                                          <div className="font-bold text-gray-900 truncate">{name}</div>
                                          <div className="flex justify-between items-center mt-1">
                                            {chat.customer_name && <span className="text-xs text-gray-400 truncate">{chat.customer_phone}</span>}
                                            <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                                                {new Date(chat.last_activity).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                          </div>
                                      </div>
                                  </div>
                              )})}"""

target_header = """                              {/* Header del Chat */}
                              <div className="h-16 border-b border-gray-200 flex items-center px-6 bg-white shrink-0 shadow-sm z-10 relative">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold mr-3">
                                      {activeChat.substring(activeChat.length - 2)}
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-gray-900">{activeChat?.startsWith('+') ? activeChat : `+${activeChat}`}</h3>"""

replacement_header = """                              {/* Header del Chat */}
                              <div className="h-16 border-b border-gray-200 flex items-center px-6 bg-white shrink-0 shadow-sm z-10 relative">
                                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mr-3">
                                      {chatList.find(c => c.customer_phone === activeChat)?.customer_name ? chatList.find(c => c.customer_phone === activeChat).customer_name.charAt(0).toUpperCase() : '#'}
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-gray-900">{chatList.find(c => c.customer_phone === activeChat)?.customer_name || (activeChat?.startsWith('+') ? activeChat : `+${activeChat}`)}</h3>"""

if target_sidebar in code and target_header in code:
    code = code.replace(target_sidebar, replacement_sidebar)
    code = code.replace(target_header, replacement_header)
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("UI updated successfully.")
else:
    print("Targets not found.")
