import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add useLayoutEffect to imports
code = code.replace("import { useState, useEffect, useRef } from 'react';", "import { useState, useEffect, useRef, useLayoutEffect } from 'react';")

# 2. Add chatContainerRef
code = code.replace("const messagesEndRef = useRef(null);", "const messagesEndRef = useRef(null);\n    const chatContainerRef = useRef(null);")

# 3. Replace the layout back to normal and add ref
target_container = """<div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] custom-scrollbar flex flex-col-reverse gap-4">
                              <div ref={messagesEndRef} />
                              {[...chatMessages].reverse().map(msg => {"""

replacement_container = """<div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] custom-scrollbar space-y-4 flex flex-col">
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

code = code.replace(target_container, replacement_container)

# 4. Fix the bottom part of the map
target_end_map = """                                  </div>
                              )})}
                              
                              {chatMessages.length >= messageLimit && (
                                  <div className="flex justify-center mt-4">
                                      <button 
                                          onClick={() => setMessageLimit(prev => prev + 50)} 
                                          className="bg-white/80 hover:bg-white text-gray-700 text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition"
                                      >
                                          Cargar mensajes anteriores
                                      </button>
                                  </div>
                              )}
                            </div>"""

replacement_end_map = """                                  </div>
                              )})}
                              <div ref={messagesEndRef} />
                            </div>"""

code = code.replace(target_end_map, replacement_end_map)

# 5. Fix the scroll logic
target_scroll = """  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // El diseño flex-col-reverse ancla la vista automáticamente al fondo.
  // Solo necesitamos el scrollToBottom si el usuario envía un mensaje nuevo.
  useEffect(() => {
    if (activeTab === 'inbox' && isInitialLoad) {
        setIsInitialLoad(false);
    }
  }, [activeChat, activeTab]);"""

replacement_scroll = """  const scrollToBottom = (smooth = false) => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: smooth ? "smooth" : "auto"
        });
    }
  };

  useLayoutEffect(() => {
    if (activeTab === 'inbox') {
      if (isInitialLoad && chatMessages.length > 0) {
          scrollToBottom(false);
          setIsInitialLoad(false);
      } else if (!isInitialLoad && chatMessages.length > 0) {
          // If not initial load, maybe a new message arrived
          // Actually, maintaining scroll during pagination is tricky, 
          // but for MVP if length changes and we are at bottom we scroll smooth.
          // For now, let's just snap to bottom if it's a new chat.
      }
    }
  }, [chatMessages, activeChat, activeTab]);

  useEffect(() => {
      // Force scroll to bottom when switching chats
      if (activeTab === 'inbox') {
          scrollToBottom(false);
      }
  }, [activeChat]);
  """

code = code.replace(target_scroll, replacement_scroll)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Reverted to normal flex with useLayoutEffect.")
