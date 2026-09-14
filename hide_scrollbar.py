import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# I want to add scrollbar-hide to the modals on line 449 and 552
target = 'max-h-[95vh] overflow-y-auto"'
replacement = 'max-h-[95vh] overflow-y-auto scrollbar-hide"'
code = code.replace(target, replacement)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Done adding scrollbar-hide to modals")
