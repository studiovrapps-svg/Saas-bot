import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace \' with '
code = code.replace("\\'", "'")

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
