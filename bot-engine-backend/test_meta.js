const token = 'EAAWRpjxCLEgBSUN2ujLdZAwGakQHu3sb6CElkAi1mNCJhMWtm9794AZCB5mLxXAaDp4WfVjuVbGUvUbbb7kYiKtmI4bS1oNqjPSG8REq3u4NEynPrjnzBZBYftcsZCp9cFKoQKnxaUsbLblteOsXGGNf6S8cBaP58GXe5V3Lh2pDcrkpugqUPmpzTSDXIrZAUb3FbCOsSMMcbxqMzBLoro08GJ26g5ZCfNdqIMtvBZBuBvWdWkSIvR3ZBxsT3aZAw9SUaiNa9blB5SqqfDsHjeOy4tMFNgvZBWSQgpJv0ZD';
const phone_id = '1307682492428703';
const to = '50231226602';

async function testMeta() {
    let payload = {
        messaging_product: `whatsapp`,
        to: to,
        type: `text`,
        text: { body: "Prueba desde script local" }
    };
    
    console.log("Enviando...");
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phone_id}/messages`, {
        method: 'POST', 
        headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
        }, 
        body: JSON.stringify(payload)
    });
    const metaResData = await metaRes.json();
    console.log("META RESPONSE:", JSON.stringify(metaResData, null, 2));
}

testMeta();
