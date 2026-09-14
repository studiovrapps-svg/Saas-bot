import sys, re

file_path = '../bot-engine-frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'<button[^>]*title="Click para alternar entre Bot y Humano"[^>]*>.*?</button>'

replace_str = '''<button 
                                    onClick={async () => {
                                        const newStatus = chatStatus === 'bot' ? 'humano' : 'bot';
                                        setChatStatus(newStatus);
                                        await fetch(\/tenant/\/chats/\/toggle, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: newStatus })
                                        });
                                    }}
                                    className={ml-4 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-colors \}
                                    title="Click para alternar entre Bot y Humano"
                                >
                                    {chatStatus === 'bot' ? '?? Bot Activo' : '?? Humano (Bot Pausado)'}
                                </button>'''

content = re.sub(pattern, replace_str, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
