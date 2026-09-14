with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

bad = 'body: JSON.stringify({ messaging_product: `whatsapp", to: to, type: `text`, text: { body: text } })'
good = 'body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "text", text: { body: text } })'
code = code.replace(bad, good)

# Check for any other similar mangled strings
bad2 = 'body: JSON.stringify({ messaging_product: `whatsapp", to: to, type: `image`, image: { link: p.image_url } })'
good2 = 'body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "image", image: { link: p.image_url } })'
code = code.replace(bad2, good2)

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Done")
