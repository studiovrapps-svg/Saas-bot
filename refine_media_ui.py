import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update the bubble wrapper padding to be thinner for images
target_wrapper = r"<div className=\{`max-w-\[70%\] rounded-xl px-4 py-2 shadow-sm relative \$\{msg.direction === 'outbound' \? 'bg-\[\#dcf8c6\] rounded-tr-none' : 'bg-white rounded-tl-none'\}`\}>"
replacement_wrapper = """<div className={`max-w-[70%] rounded-xl shadow-sm relative ${msg.message_type === 'image' ? 'p-1' : 'px-4 py-2'} ${msg.direction === 'outbound' ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>"""
code = re.sub(target_wrapper, replacement_wrapper, code)

# 2. Update the image styling (remove mt-1 mb-1, make it edge-to-edge inside the thin p-1 padding)
target_img = r"<img src=\{msg.content\} alt=\"Imagen\" className=\"rounded-lg max-w-full h-auto mt-1 mb-1 object-cover max-h-64\" />"
replacement_img = """<img src={msg.content} alt="Imagen" className="rounded-[8px] max-w-full h-auto object-cover max-h-72 block" />"""
code = re.sub(target_img, replacement_img, code)

# 3. Update the audio styling (remove boxy border)
target_audio = r"<p className=\"text-sm text-gray-800 italic bg-white/50 p-2 rounded border border-gray-100\">\"\{msg.content\}\"</p>"
replacement_audio = """<p className="text-sm text-gray-800 italic leading-relaxed mt-1">"{msg.content}"</p>"""
code = re.sub(target_audio, replacement_audio, code)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("UI refined for media bubbles.")
