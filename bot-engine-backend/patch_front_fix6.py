import sys

file_path = '../bot-engine-frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("?? Bot Activo", "🤖 Bot Activo")
content = content.replace("?? Humano (Bot Pausado)", "👤 Humano (Bot Pausado)")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
