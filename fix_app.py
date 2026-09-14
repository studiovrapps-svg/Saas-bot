import sys

file_path = 'bot-engine-frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_string = "await fetch(\/tenant/\/chats/\/toggle, {"
good_string = "await fetch(`${API_URL}/api/tenant/${tenant.id}/chats/${activeChat}/toggle`, {"

content = content.replace(bad_string, good_string)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed App.jsx")
