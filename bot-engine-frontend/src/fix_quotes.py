import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the escaped quotes that were accidentally added
code = code.replace("navigate(\\'/admin\\')", "navigate('/admin')")

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
