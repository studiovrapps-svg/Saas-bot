import sys

file_path = '../bot-engine-frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_str = r'''className={ml-4 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-colors \}'''
good_str = 'className={`ml-4 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-colors ${chatStatus === \'bot\' ? \'bg-green-100 text-green-700 hover:bg-green-200\' : \'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300 animate-pulse\'}`}'

content = content.replace(bad_str, good_str)
content = content.replace("?? Bot Activo", "?? Bot Activo")
content = content.replace("?? Humano (Bot Pausado)", "?? Humano (Bot Pausado)")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
