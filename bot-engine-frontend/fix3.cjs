const fs = require('fs');

function fixStyles(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the inner wrapper background that was overriding my global bg-slate-100
    content = content.replace(/className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/g, 'className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100');
    
    // Replace the specific custom shadow that the dashboard cards use
    content = content.replace(/shadow-\[0_2px_10px_-3px_rgba\(6,81,237,0\.05\)\]/g, 'shadow-md');
    
    // Replace other instances of bg-gray-50 that might act as backgrounds for large areas
    // Let's just catch the main one. Wait, in super admin it's `className="flex-1 overflow-y-auto p-8 bg-gray-50"`
    content = content.replace(/className="flex-1 overflow-y-auto p-8 bg-gray-50/g, 'className="flex-1 overflow-y-auto p-8 bg-slate-100');

    fs.writeFileSync(filePath, content);
    console.log('Fixed styles in', filePath);
}

fixStyles('src/pages/ClientDashboard.jsx');
fixStyles('src/pages/SuperAdminDashboard.jsx');
