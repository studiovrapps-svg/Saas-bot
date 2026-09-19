import fs from 'fs';
const content = fs.readFileSync('src/pages/ClientDashboard.jsx', 'utf8');
const shadows = content.match(/shadow-[^\s"]+/g) || [];
console.log([...new Set(shadows)].join('\n'));
