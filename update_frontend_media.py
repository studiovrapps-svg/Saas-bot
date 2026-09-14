import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = """                                            {msg.message_type === 'image' ? (
                                                <div className="text-sm text-gray-500 italic">🖼️ Imagen enviada</div>
                                            ) : msg.message_type === 'interactive' ? ("""

replacement = """                                            {msg.message_type === 'image' ? (
                                                msg.content && msg.content.startsWith('http') ? (
                                                    <img src={msg.content} alt="Imagen" className="rounded-lg max-w-full h-auto mt-1 mb-1 object-cover max-h-64" />
                                                ) : (
                                                    <div className="text-sm text-gray-500 italic">🖼️ Imagen enviada</div>
                                                )
                                            ) : msg.message_type === 'audio' ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-indigo-600">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path></svg>
                                                        <span className="text-xs font-bold uppercase tracking-wider">Audio Transcrito</span>
                                                    </div>
                                                    <p className="text-sm text-gray-800 italic bg-white/50 p-2 rounded border border-gray-100">"{msg.content}"</p>
                                                </div>
                                            ) : msg.message_type === 'interactive' ? ("""

if target in code:
    code = code.replace(target, replacement)
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("App.jsx updated with image/audio rendering.")
else:
    print("Target not found in App.jsx")
