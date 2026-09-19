import fs from 'fs';
const content = fs.readFileSync('src/pages/ClientDashboard.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('bg-gray-50')) {
        console.log(`Line ${i+1}: ${line.trim()}`);
    }
});
