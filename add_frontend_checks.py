import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = """                                            <div className="text-[10px] text-gray-400 text-right mt-1">
                                                {new Date(msg.created_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                            </div>"""

replacement = """                                            <div className="text-[10px] text-gray-400 text-right mt-1 flex justify-end items-center gap-1">
                                                {new Date(msg.created_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                                {msg.direction === 'outbound' && (
                                                    msg.delivery_status === 'read' ? (
                                                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7M5 19l4-4M19 13l-4 4" /></svg>
                                                    ) : msg.delivery_status === 'delivered' ? (
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7M5 19l4-4M19 13l-4 4" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                    )
                                                )}
                                            </div>"""

if target in code:
    code = code.replace(target, replacement)
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Frontend checks added")
else:
    print("Target not found")
