const pool = require('./src/config/db');
pool.query('SELECT whatsapp_token FROM tenants WHERE whatsapp_token IS NOT NULL LIMIT 1').then(res => {
    if(res.rows.length > 0) {
        const token = res.rows[0].whatsapp_token;
        const app_id = '1567518045121608';
        const app_secret = 'cbc0d6041a9c6302aac8c73f6b2c4352';
        fetch(`https://graph.facebook.com/v19.0/debug_token?input_token=${token}&access_token=${app_id}|${app_secret}`)
        .then(r => r.json()).then(d => {
            console.log("DEBUG TOKEN:", JSON.stringify(d, null, 2));
            
            if (d.data && d.data.user_id) {
                fetch(`https://graph.facebook.com/v19.0/${d.data.user_id}/businesses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(r2 => r2.json()).then(d2 => {
                    console.log("USER BUSINESSES:", JSON.stringify(d2, null, 2));
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        });
    } else {
        console.log('No token found');
        process.exit(0);
    }
});
