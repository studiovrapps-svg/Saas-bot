import sys

file_path = '../bot-engine-frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_str = "className={ml-4 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-colors }"
good_str = 'className={ml-4 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-colors \}'

content = content.replace(bad_str, good_str)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
