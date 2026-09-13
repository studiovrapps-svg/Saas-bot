import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix title collision with edit buttons
code = code.replace(
    '<h3 className="font-bold text-lg line-clamp-1 text-gray-800">{p.name}</h3>',
    '<h3 className="font-bold text-lg line-clamp-1 text-gray-800 pr-16 md:pr-0">{p.name}</h3>'
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
