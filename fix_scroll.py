import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = """  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);"""

replacement = """  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length, activeChat]);"""

code = code.replace(target, replacement)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Updated scroll dependency")
