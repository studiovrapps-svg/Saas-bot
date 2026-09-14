import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the div wrapping the input with id="killswitch"
pattern = r'<div className="relative inline-flex items-center cursor-pointer shrink-0">\s*<input type="checkbox" id="killswitch"[^>]+>\s*<div className="w-11[^>]+></div>\s*</div>'

def replacer(match):
    text = match.group(0)
    text = text.replace('<div className="relative inline-flex', '<label htmlFor="killswitch" className="relative inline-flex')
    text = text.replace('</div>\n                        </div>', '</div>\n                        </label>')
    # Just in case the spaces are different:
    text = re.sub(r'</div>$', '</label>', text)
    return text

new_code = re.sub(pattern, replacer, code)

if new_code != code:
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(new_code)
    print("Killswitch fixed")
else:
    print("Regex failed")
