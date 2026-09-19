const fs = require('fs');

function updateFileStyles(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/shadow-sm/g, 'shadow-md');
    content = content.replace(/border-gray-100/g, 'border-gray-200');
    content = content.replace(/border-gray-200\/60/g, 'border-gray-200');
    content = content.replace(/bg-white\/\d{2}/g, 'bg-white');
    content = content.replace(/backdrop-blur-sm/g, '');
    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
}

updateFileStyles('src/pages/SuperAdminDashboard.jsx');
