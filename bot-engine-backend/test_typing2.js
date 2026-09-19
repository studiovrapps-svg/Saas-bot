const doTest = async () => {
    const pool = require('./src/config/db');
    const res = await pool.query('SELECT whatsapp_token, whatsapp_phone_id FROM tenants WHERE id = 2');
    const token = res.rows[0].whatsapp_token;
    const phone_id = res.rows[0].whatsapp_phone_id;
    
    console.log("Testing just typing indicator");
    const payload3 = {
        messaging_product: "whatsapp",
        to: "50231226602",
        type: "typing_indicator", // try type instead of action? No wait, that failed above? No, I tried sender_action above.
    };
    
    // Wait, let's try the EXACT payload from the summary but without status: read
    // The summary had:
    // { "messaging_product": "whatsapp", "status": "read", "message_id": "...", "typing_indicator": { "type": "text" } }
    // Let's just try sending exactly the same, but wait... why would a typing indicator require a message ID?
    // Because maybe it's only active when you reply to a message? But WhatsApp doesn't have thread-based typing indicators usually.
    
    // Actually, WhatsApp Business API does NOT have a typing indicator endpoint at all officially!
    // Wait! A recent feature (maybe 2026? or maybe just conversational components) MIGHT have added it.
    // Wait... what if I just use `action: "typing_on"`?
    
    console.log("Testing 3");
    const payload4 = {
        messaging_product: "whatsapp",
        to: "50231226602",
        action: "typing_on"
    };
    const r4 = await fetch(`https://graph.facebook.com/v19.0/${phone_id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload4)
    });
    console.log("Res4:", await r4.text());
    
    process.exit(0);
};
doTest();
