import sys, re

file_path = '../bot-engine-frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'<button[^>]*title="Click para alternar entre Bot y Humano"[^>]*>.*?</button>'

replace_str = '''<button 
                                    onClick={async () => {
                                        const newStatus = chatStatus === 'bot' ? 'humano' : 'bot';
                                        setChatStatus(newStatus);
                                        await fetch(`${API_URL}/tenant/${tenantId}/chats/${activeChat}/toggle`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: newStatus })
                                        });
                                    }}
                                    className={`ml-4 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-colors ${chatStatus === 'bot' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300 animate-pulse'}`}
                                    title="Click para alternar entre Bot y Humano"
                                >
                                    {chatStatus === 'bot' ? '?? Bot Activo' : '?? Humano (Bot Pausado)'}
                                </button>'''

content = re.sub(pattern, lambda m: replace_str, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
