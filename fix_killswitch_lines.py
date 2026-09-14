with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'id="killswitch"' in line:
        # The line before should be the div
        if '<div className="relative inline-flex items-center cursor-pointer shrink-0">' in lines[i-1]:
            lines[i-1] = lines[i-1].replace('<div', '<label htmlFor="killswitch"')
            
        # The line after is the visual div
        # The line after that is the closing div
        if '</div>' in lines[i+2]:
            lines[i+2] = lines[i+2].replace('</div>', '</label>')

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Fixed lines")
