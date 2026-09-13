import re

with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(', , title', ', title')

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
