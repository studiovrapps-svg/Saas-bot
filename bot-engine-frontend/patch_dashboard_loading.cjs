const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.jsx', 'utf-8');

// We need to add a loading state per FAQ index
if (!content.includes('faqUploadLoading')) {
    content = content.replace(
        /const \[faqs, setFaqs\] = useState\(\[\{ q: '', a: '' \}\]\);/,
        "const [faqs, setFaqs] = useState([{ q: '', a: '' }]);\n    const [faqUploadLoading, setFaqUploadLoading] = useState({});"
    );
    
    // Update handleUploadFaqImage
    const newHandleUpload = `
    const handleUploadFaqImage = async (e, idx) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setFaqUploadLoading(prev => ({...prev, [idx]: true}));
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
        } catch(err) { 
            console.error(err); 
            alert("Error de red al subir imagen"); 
        } finally {
            setFaqUploadLoading(prev => ({...prev, [idx]: false}));
        }
    };
    `;
    
    content = content.replace(
        /const handleUploadFaqImage = async \([^]*?catch\(err\) \{[^]*?\};/,
        newHandleUpload.trim()
    );
    
    // Update UI
    const newUI = `
                                        <label className={\`cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold py-1 px-3 rounded-md transition-colors flex items-center gap-1 \${faqUploadLoading[index] ? 'opacity-50 pointer-events-none' : ''}\`}>
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                            {faqUploadLoading[index] ? 'Subiendo...' : 'Subir Imagen'}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadFaqImage(e, index)} disabled={faqUploadLoading[index]} />
                                        </label>
    `;
    content = content.replace(
        /<label className="cursor-pointer bg-gray-100 hover:bg-gray-200[^>]*>[^]*?<\/label>/,
        newUI.trim()
    );
    
    fs.writeFileSync('src/pages/ClientDashboard.jsx', content, 'utf-8');
    console.log("Added loading state.");
}
