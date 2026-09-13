import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the closing of SuperAdminDashboard using a more flexible regex
code = re.sub(
    r'\s*\)\}\n\s*</div>\n\s*\);\n\s*\}\n\nfunction ClientDashboard\(\) \{',
    '\n      )}\n      </div>\n    </div>\n  );\n}\n\nfunction ClientDashboard() {',
    code
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
