with open('bot-engine-backend/src/controllers/webhook.controller.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith("});"):
        lines[i] = line.replace("});", "};")

with open('bot-engine-backend/src/controllers/webhook.controller.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
