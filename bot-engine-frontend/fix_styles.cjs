const fs = require('fs');

function updateFileStyles(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace shadow-sm with shadow-md
    content = content.replace(/shadow-sm/g, 'shadow-md');
    
    // Replace border-gray-100 with border-gray-200 in card backgrounds
    content = content.replace(/border-gray-100/g, 'border-gray-200');

    // Replace border-gray-200/60 with border-gray-200
    content = content.replace(/border-gray-200\/60/g, 'border-gray-200');
    
    // Sometimes there are bg-white/90 or bg-white/80, let's remove transparency for cards
    content = content.replace(/bg-white\/\d{2}/g, 'bg-white');

    // Remove backdrop-blur-sm since it's not needed if we remove transparency
    content = content.replace(/backdrop-blur-sm/g, '');

    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
}

updateFileStyles('src/pages/ClientDashboard.jsx');
