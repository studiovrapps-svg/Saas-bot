import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the extra div
code = re.sub(
    r'\s*\)\}\n\s*</div>\n\s*</div>\n\s*\{/\* Vista M',
    '\n                        )}\n                    </div>\n\n                      {/* Vista M',
    code
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
