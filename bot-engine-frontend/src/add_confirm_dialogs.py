import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update Tier 1 Menu Delete Button
code = re.sub(
    r'onClick=\{\(\) => \{ let nm = \[\.\.\.tier1Menu\]; nm\.splice\(idx,1\); setTier1Menu\(nm\); \}\}',
    'onClick={() => { if(window.confirm("¿Estás seguro de que deseas eliminar esta opción?")) { let nm = [...tier1Menu]; nm.splice(idx,1); setTier1Menu(nm); } }}',
    code
)

# 2. Update FAQs Delete Button
code = re.sub(
    r'onClick=\{\(\) => setFaqs\(faqs\.filter\(\(\_, i\) => i !== index\)\)\}',
    'onClick={() => { if(window.confirm("¿Estás seguro de que deseas eliminar esta pregunta?")) setFaqs(faqs.filter((_, i) => i !== index)); }}',
    code
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
