with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if '¿Cuántas unidades deseas llevar? (Responde con un número)`);' in line and 'await' not in line:
        continue
    if 'Cuǭntas unidades deseas llevar? (Responde con un nǧmero)`);' in line and 'await' not in line:
        continue
    new_lines.append(line)

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("Done")
