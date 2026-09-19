const doTest = async () => {
    const pool = require('./src/config/db');
    const res = await pool.query('SELECT whatsapp_token, whatsapp_phone_id FROM tenants WHERE id = 2');
    const token = res.rows[0].whatsapp_token;
    const phone_id = res.rows[0].whatsapp_phone_id;
    
    console.log("Testing sender_action: typing_on");
    const payload1 = {
        messaging_product: 'whatsapp',
        to: '50231226602',
        sender_action: 'typing_on'
    };
    const r1 = await fetch(`https://graph.facebook.com/v19.0/${phone_id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload1)
    });
    console.log("Res1:", await r1.text());

    console.log("Testing typing_indicator object");
    const payload2 = {
        messaging_product: "whatsapp",
        status: "read", // try omitting this
        message_id: "wamid.HBgLNTAyMzEyMjY2MDIVAgASGCBBNTk5QUM5QjYzRDUwMzMzMEM0NDI1RUZFQkU4ODA1OAA=", // fake or old
        to: "50231226602",
        typing_indicator: { type: "text" }
    };
    const r2 = await fetch(`https://graph.facebook.com/v19.0/${phone_id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload2)
    });
    console.log("Res2:", await r2.text());
    
    process.exit(0);
};
doTest();
