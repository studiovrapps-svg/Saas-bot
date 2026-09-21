const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.jsx', 'utf-8');

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

if (!content.includes('const handleUploadFaqImage')) {
    content = content.replace(
        /const handleImageUploadMenu = async/,
        uploadFaqImageFn + '\n    const handleImageUploadMenu = async'
    );
    fs.writeFileSync('src/pages/ClientDashboard.jsx', content, 'utf-8');
    console.log("handleUploadFaqImage injected.");
}
