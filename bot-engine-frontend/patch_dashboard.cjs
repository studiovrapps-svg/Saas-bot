const fs = require('fs');

let content = fs.readFileSync('src/pages/ClientDashboard.jsx', 'utf-8');

// The FAQ map block is around line 430
// I need to add the same image upload logic that exists for Tier 1 menu.
// Tier 1 image upload UI:
/*
<div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-2">
    <div className="flex gap-2 items-center">
        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold py-1 px-3 rounded-md transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Subir Imagen
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadImage(e, idx)} />
        </label>
        {m.image_url && (
            <div className="flex items-center gap-2 bg-white p-1 pr-2 rounded-lg border border-gray-200 shadow-sm">
                <img src={m.image_url} alt="Adjunto" className="w-6 h-6 object-cover rounded-md" />
                <button onClick={() => { let nm = [...tier1Menu]; delete nm[idx].image_url; setTier1Menu(nm); }} className="text-gray-400 hover:text-red-500 text-[10px] font-bold px-1 transition-colors">Quitar</button>
            </div>
        )}
    </div>
</div>
*/

const faqImageUI = `
                                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
                                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold py-1 px-3 rounded-md transition-colors flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                            Subir Imagen
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadFaqImage(e, index)} />
                                        </label>
                                        {faq.image_url && (
                                            <div className="flex items-center gap-2 bg-white p-1 pr-2 rounded-lg border border-gray-200 shadow-sm">
                                                <img src={faq.image_url} alt="Adjunto" className="w-6 h-6 object-cover rounded-md" />
                                                <button onClick={() => { const newFaqs = [...faqs]; delete newFaqs[index].image_url; setFaqs(newFaqs); }} className="text-gray-400 hover:text-red-500 text-[10px] font-bold px-1 transition-colors">Quitar</button>
                                            </div>
                                        )}
                                    </div>
`;

content = content.replace(
    /textarea><\/div>\s*<\/div>\s*\)\)/,
    'textarea></div>' + faqImageUI + '</div>))'
);

// Add handleUploadFaqImage
const uploadFaqImageFn = `
    const handleUploadFaqImage = async (e, idx) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await fetch(\`\${API_URL}/upload\`, { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok && data.url) {
                let nf = [...faqs];
                nf[idx].image_url = data.url;
                setFaqs(nf);
            } else {
                alert("Error subiendo imagen: " + (data.error || ""));
            }
        } catch(err) { console.error(err); alert("Error de red al subir imagen"); }
    };
`;

content = content.replace(
    /const handleUploadImage = async \(e, idx\) => {/,
    uploadFaqImageFn + '\n    const handleUploadImage = async (e, idx) => {'
);

fs.writeFileSync('src/pages/ClientDashboard.jsx', content, 'utf-8');
console.log("ClientDashboard updated with FAQ images.");
