import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = """                        ) : chatList.map(chat => (
                            <div 
                                key={chat.customer_phone} 
                                onClick={() => setActiveChat(chat.customer_phone)}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition ${activeChat === chat.customer_phone ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-100 border-l-4 border-l-transparent'}`}
                            >
                                <div className="font-bold text-gray-900 truncate">+{chat.customer_phone}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {new Date(chat.last_activity).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        ))}"""

replacement = """                        ) : chatList.map(chat => {
                            const phoneStr = chat.customer_phone?.startsWith('+') ? chat.customer_phone : `+${chat.customer_phone}`;
                            const name = chat.customer_name || phoneStr;
                            const initial = chat.customer_name ? chat.customer_name.charAt(0).toUpperCase() : '#';
                            return (
                            <div 
                                key={chat.customer_phone} 
                                onClick={() => setActiveChat(chat.customer_phone)}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition flex items-center gap-3 ${activeChat === chat.customer_phone ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-100 border-l-4 border-l-transparent'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0">
                                    {initial}
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <div className="font-bold text-gray-900 truncate">{name}</div>
                                    <div className="flex justify-between items-center mt-0.5">
                                      {chat.customer_name && <span className="text-[11px] text-gray-400 truncate">{phoneStr}</span>}
                                      <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                                          {new Date(chat.last_activity).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                    </div>
                                </div>
                            </div>
                        )})}"""

if target in code:
    code = code.replace(target, replacement)
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Sidebar updated successfully.")
else:
    print("Target not found.")
