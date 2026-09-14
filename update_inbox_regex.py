import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace sidebar logic
sidebar_pattern = re.compile(r"\{\s*chatList\.map\(\(chat, idx\)\s*=>\s*\(\s*<div\s*key=\{idx\}\s*onClick=\{.*?className=\{`p-4 cursor-pointer hover:bg-gray-50 transition border-b border-gray-100 border-l-4 \$\{activeChat === chat\.customer_phone \? 'bg-blue-50/50 border-l-blue-500' : 'border-l-transparent'}`\}\s*>\s*<div className=\"font-bold text-gray-900\">\{.*?\}\s*</div>\s*<div className=\"text-xs text-gray-400 mt-1\">\s*\{new Date\(chat\.last_activity\).*?\}\s*</div>\s*</div>\s*\)\)\s*\}", re.DOTALL)

sidebar_replacement = """{chatList.map((chat, idx) => {
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

code = sidebar_pattern.sub(sidebar_replacement, code)

# Replace header logic
header_pattern = re.compile(r"<div className=\"w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 font-bold text-gray-500\">\s*\{activeChat\.substring\(0, 2\)\}\s*</div>\s*<div>\s*<h3 className=\"font-bold text-gray-900\">\+\{activeChat\}</h3>", re.DOTALL)

header_replacement = """<div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-3 font-bold">
    {chatList.find(c => c.customer_phone === activeChat)?.customer_name ? chatList.find(c => c.customer_phone === activeChat).customer_name.charAt(0).toUpperCase() : '#'}
</div>
<div>
    <h3 className="font-bold text-gray-900">{chatList.find(c => c.customer_phone === activeChat)?.customer_name || `+${activeChat.replace('+', '')}`}</h3>"""

code = header_pattern.sub(header_replacement, code)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("UI updated via regex.")
