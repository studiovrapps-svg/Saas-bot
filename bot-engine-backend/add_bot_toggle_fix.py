import sys, re

file_path = './src/controllers/inbox.controller.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("str(muteUntil)", "muteUntil.toString()")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Backend fixed")
