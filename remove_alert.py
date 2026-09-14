import sys
import re

file_path = 'bot-engine-frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

alert_pattern = r'\s*// Simplemente mostraremos la alerta.*?if\s*\(document\.body\.innerHTML\.includes\([\'"]1567518045121608[\'"]\)\)\s*\{[\s\S]*?return;\s*\}'
content = re.sub(alert_pattern, "", content, flags=re.IGNORECASE|re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Alert removed")
