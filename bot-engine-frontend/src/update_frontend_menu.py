import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add handleImageUploadMenu function
func_text = """    const handleImageUploadMenu = async (idx, file) => {
        if(!file) return;
        const form = new FormData();
        form.append('image', file);
        try {
            const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: form });
            const data = await res.json();
            let nm = [...tier1Menu];
            nm[idx].image_url = data.url;
            setTier1Menu(nm);
        } catch(err) { alert('Error al subir imagen'); }
    };"""

# We can insert it right before handleSaveConfig
code = code.replace("    const handleSaveConfig = async () => {", func_text + "\n\n    const handleSaveConfig = async () => {")

# 2. Add the UI for uploading image
old_response_div = """                            <div className="flex-[2]">
                                <label className="text-xs font-bold text-gray-500">Respuesta del Bot</label>
                                <input type="text" value={m.response} onChange={e => { let nm = [...tier1Menu]; nm[idx].response = e.target.value; setTier1Menu(nm); }} className="w-full border p-2 rounded outline-none text-sm" placeholder="El texto que el bot responderá al tocar este botón..." />
                            </div>"""

new_response_div = """                            <div className="flex-[2]">
                                <label className="text-xs font-bold text-gray-500">Respuesta del Bot</label>
                                <input type="text" value={m.response} onChange={e => { let nm = [...tier1Menu]; nm[idx].response = e.target.value; setTier1Menu(nm); }} className="w-full border p-2 rounded outline-none text-sm" placeholder="El texto que el bot responderá al tocar este botón..." />
                                
                                <div className="mt-2 flex items-center gap-2">
                                    <label className="text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 cursor-pointer px-3 py-1.5 rounded flex items-center gap-1 transition">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        Adjuntar Imagen
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUploadMenu(idx, e.target.files[0])} />
                                    </label>
                                    {m.image_url && (
                                        <div className="relative group">
                                            <img src={m.image_url} alt="Adjunto" className="w-8 h-8 object-cover rounded border" />
                                            <button onClick={() => { let nm = [...tier1Menu]; delete nm[idx].image_url; setTier1Menu(nm); }} className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[10px] font-bold md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center transition">X</button>
                                        </div>
                                    )}
                                </div>
                            </div>"""

# Since "responderá" could have an encoding issue in python, I'll use regex.
code = re.sub(
    r'<div className="flex-\[2\]">\s*<label className="text-xs font-bold text-gray-500">Respuesta del Bot</label>\s*<input type="text" value=\{m\.response\}.*?/>\s*</div>',
    new_response_div,
    code
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
