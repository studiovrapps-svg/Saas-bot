const doTest = async () => {
    const pool = require('./src/config/db');
    const res = await pool.query('SELECT whatsapp_token, whatsapp_phone_id FROM tenants WHERE id = 2');
    const token = res.rows[0].whatsapp_token;
    const phone_id = res.rows[0].whatsapp_phone_id;
    
    // Testing different standard API structures
    const payloads = [
        { messaging_product: 'whatsapp', recipient_type: 'individual', to: '50231226602', type: 'text', text: { body: "Prueba 1" } }
    ];
    
    // Wait, wait, wait... I just realized, there's NO typing indicator in WhatsApp.
    // People ask for it constantly on Stack Overflow. 
    // Did Meta just add it? If so, what's the actual payload?
    
    process.exit(0);
};
doTest();
