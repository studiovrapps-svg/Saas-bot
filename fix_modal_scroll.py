import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = 'className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100"'
replacement = 'className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 max-h-[95vh] overflow-y-auto"'

code = code.replace(target, replacement)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Fixed modal overflow")
