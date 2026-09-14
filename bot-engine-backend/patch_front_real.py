import sys, re

file_path = '../bot-engine-frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject state if not there
if "const [chatStatus, setChatStatus]" not in content:
    content = content.replace("const [chatMessages, setChatMessages] = useState([]);", "const [chatMessages, setChatMessages] = useState([]);\n    const [chatStatus, setChatStatus] = useState('bot');")

# 2. Inject session fetch in polling
search_polling = '''          const res = await fetch(\/tenant/\/chats/\?limit=\);
          const data = await res.json();
          setChatMessages(Array.isArray(data) ? data : []);'''

replace_polling = '''          const res = await fetch(\/tenant/\/chats/\?limit=\);
          const data = await res.json();
          setChatMessages(Array.isArray(data) ? data : []);
          try {
              const res3 = await fetch(\/tenant/\/chats/\/session);
              const data3 = await res3.json();
              setChatStatus(data3.status || 'bot');
          } catch(e) {}'''

if "chats//session" not in content:
    content = content.replace(search_polling, replace_polling)

# 3. Inject Button in Header using regex
pattern = r'(<h3 className="font-bold text-gray-900">\{chatList\.find\(.*?</h3>\s*<p.*?WhatsApp\)</p>\s*</div>\s*</div>)'
replace_str = r'''\1
                                
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
                                    className={ml-4 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-colors }
                                    title="Click para alternar entre Bot y Humano"
                                >
                                    {chatStatus === 'bot' ? '?? Bot Activo' : '?? Humano (Bot Pausado)'}
                                </button>'''

if "Click para alternar entre Bot y Humano" not in content:
    content = re.sub(pattern, replace_str, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Frontend updated correctly")
