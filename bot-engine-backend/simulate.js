const { processWebhook } = require('./src/controllers/webhook.controller');
const pool = require('./src/config/db');

async function test() {
    const req = {
        body: {
            "object": "whatsapp_business_account",
            "entry": [
                {
                    "id": "2148608359340940",
                    "changes": [
                        {
                            "value": {
                                "messaging_product": "whatsapp",
                                "metadata": {
                                    "display_phone_number": "15556739508",
                                    "phone_number_id": "1307682492428703"
                                },
                                "contacts": [
                                    {
                                        "profile": { "name": "Trueque" },
                                        "wa_id": "50231226602"
                                    }
                                ],
                                "messages": [
                                    {
                                        "from": "50231226602",
                                        "id": "wamid.HBgLNTAyMzEyMjY2MDIVAg...",
                                        "timestamp": "1789349030",
                                        "type": "text",
                                        "text": { "body": "Hola" }
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        }
    };
    const res = {
        sendStatus: (code) => { console.log("RES.SENDSTATUS:", code); }
    };

    try {
        await processWebhook(req, res);
    } catch (e) {
        console.error("CAUGHT EXCEPTION:", e);
    }
    
    setTimeout(() => process.exit(0), 3000);
}
test();
