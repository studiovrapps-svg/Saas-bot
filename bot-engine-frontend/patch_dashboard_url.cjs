const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.jsx', 'utf-8');

const correctFetch = `
            const res = await fetch(\`\${API_URL}/tenant/\${tenantId}/upload\`, { 
                method: 'POST', 
                headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` },
                body: formData 
            });
`;

content = content.replace(
    /const res = await fetch\(`\$\{API_URL\}\/upload`, \{ method: 'POST', body: formData \}\);/,
    correctFetch.trim()
);

fs.writeFileSync('src/pages/ClientDashboard.jsx', content, 'utf-8');
console.log("Fixed API endpoint and authorization header for FAQ upload");
