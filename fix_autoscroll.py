import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = """  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length, activeChat]);"""

replacement = """  useEffect(() => {
    if (activeTab === 'inbox') {
      setTimeout(scrollToBottom, 50);
    }
  }, [chatMessages.length, activeChat, activeTab]);"""

if target in code:
    code = code.replace(target, replacement)
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Auto-scroll fixed for tab switching.")
else:
    print("Target not found.")
