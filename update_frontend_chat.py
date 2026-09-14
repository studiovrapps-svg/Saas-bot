import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add Inbox states and functions
inbox_logic = """  const [loadingOrders, setLoadingOrders] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Polling para lista de chats
  useEffect(() => {
    let interval;
    if (activeTab === 'inbox') {
      const fetchChats = async () => {
        try {
          const res = await fetch(`http://localhost:3000/api/tenant/${id}/chats`);
          const data = await res.json();
          setChatList(data);
        } catch(e) {}
      };
      fetchChats();
      interval = setInterval(fetchChats, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab, id]);

  // Polling para mensajes activos
  useEffect(() => {
    let interval;
    if (activeTab === 'inbox' && activeChat) {
      const fetchMessages = async () => {
        try {
          const res = await fetch(`http://localhost:3000/api/tenant/${id}/chats/${activeChat}`);
          const data = await res.json();
          setChatMessages(data);
        } catch(e) {}
      };
      fetchMessages();
      interval = setInterval(fetchMessages, 3000);
    }
    return () => clearInterval(interval);
  }, [activeTab, activeChat, id]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeChat) return;
    const text = replyText;
    setReplyText("");
    
    // Optistic update
    setChatMessages(prev => [...prev, { id: Date.now(), direction: 'outbound', content: text, created_at: new Date().toISOString() }]);

    try {
      await fetch(`http://localhost:3000/api/tenant/${id}/chats/${activeChat}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      });
    } catch(e) {
      console.error(e);
    }
  };
"""
code = code.replace("const [loadingOrders, setLoadingOrders] = useState(false);", inbox_logic)

# Make sure useRef is imported
if "useRef" not in code:
    code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, useRef } from 'react';")

# 2. Replace the inbox placeholder with actual UI
old_inbox = """              {activeTab === 'inbox' && (
                <div className="bg-white p-16 text-center rounded-2xl border border-gray-200 shadow-sm mt-8">
                    <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Bandeja Multi-Agente</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Este módulo te permite conectar múltiples agentes para responder chats simultáneamente desde esta plataforma.</p>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">Configurar Agentes</button>
                </div>
              )}"""

new_inbox = """              {activeTab === 'inbox' && (
                <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4">
                  {/* Sidebar de Chats */}
                  <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <h3 className="font-bold text-gray-800 text-lg">Mensajes</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {chatList.length === 0 ? (
                            <p className="text-sm text-gray-500 p-4 text-center">No hay conversaciones recientes.</p>
                        ) : chatList.map(chat => (
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
                        ))}
                    </div>
                  </div>

                  {/* Área de Chat */}
                  <div className="w-2/3 flex flex-col bg-white">
                    {activeChat ? (
                        <>
                            <div className="p-4 border-b border-gray-200 bg-white flex items-center shadow-sm z-10">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 font-bold text-gray-500">
                                    {activeChat.substring(0, 2)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">+{activeChat}</h3>
                                    <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> En línea (WhatsApp)</p>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] custom-scrollbar space-y-4">
                                {chatMessages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-xl px-4 py-2 shadow-sm relative ${msg.direction === 'outbound' ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                            {msg.message_type === 'image' ? (
                                                <div className="text-sm text-gray-500 italic">🖼️ Imagen enviada</div>
                                            ) : msg.message_type === 'interactive' ? (
                                                <div className="text-sm font-semibold text-gray-700 bg-gray-100 p-2 rounded border border-gray-200">{msg.content} <span className="text-xs block text-gray-400 font-normal mt-1">(Menú Interactivo)</span></div>
                                            ) : (
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                                            )}
                                            <div className="text-[10px] text-gray-400 text-right mt-1">
                                                {new Date(msg.created_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-3 bg-gray-100 border-t border-gray-200">
                                <form onSubmit={handleSendReply} className="flex gap-2 bg-white rounded-full p-1 pl-4 shadow-sm border border-gray-300 items-center">
                                    <input 
                                        type="text" 
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        placeholder="Escribe un mensaje..."
                                        className="flex-1 outline-none bg-transparent text-sm"
                                    />
                                    <button type="submit" disabled={!replyText.trim()} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-8 text-center">
                            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                            <h3 className="text-xl font-bold text-gray-500 mb-2">Bandeja de Entrada</h3>
                            <p className="text-sm max-w-sm">Selecciona una conversación a la izquierda para empezar a chatear o ver el historial del bot.</p>
                        </div>
                    )}
                  </div>
                </div>
              )}"""

code = code.replace(old_inbox, new_inbox)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
