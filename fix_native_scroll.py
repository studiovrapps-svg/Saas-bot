import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update the Chat Container to flex-col-reverse and adjust the layout
target_container = """<div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] custom-scrollbar space-y-4">
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

replacement_container = """<div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] custom-scrollbar flex flex-col-reverse gap-4">
                              <div ref={messagesEndRef} />
                              {[...chatMessages].reverse().map(msg => {"""

code = code.replace(target_container, replacement_container)

# 2. Add the "Cargar mensajes anteriores" button after the map finishes (which visually is at the TOP)
target_end_map = """                                  </div>
                              )})}
                              <div ref={messagesEndRef} />
                            </div>"""

replacement_end_map = """                                  </div>
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

code = code.replace(target_end_map, replacement_end_map)

# 3. Clean up the useEffect scroll hacks, since flex-col-reverse natively anchors to the bottom
target_scroll = """  const scrollToBottom = (smooth = false) => {
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

replacement_scroll = """  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // El diseño flex-col-reverse ancla la vista automáticamente al fondo.
  // Solo necesitamos el scrollToBottom si el usuario envía un mensaje nuevo.
  useEffect(() => {
    if (activeTab === 'inbox' && isInitialLoad) {
        setIsInitialLoad(false);
    }
  }, [activeChat, activeTab]);"""

code = code.replace(target_scroll, replacement_scroll)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Flex-col-reverse implemented for native bottom scrolling.")
