import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace any literal newlines inside double quotes using a generic regex
code = re.sub(r'"([^"]*)\n([^"]*)"', r'`\1\n\2`', code)
code = re.sub(r'"([^"]*)\n([^"]*)"', r'`\1\n\2`', code)

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Done generic regex")
