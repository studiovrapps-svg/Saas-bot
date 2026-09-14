const token = 'EAAWRpjxCLEgBSUN2ujLdZAwGakQHu3sb6CElkAi1mNCJhMWtm9794AZCB5mLxXAaDp4WfVjuVbGUvUbbb7kYiKtmI4bS1oNqjPSG8REq3u4NEynPrjnzBZBYftcsZCp9cFKoQKnxaUsbLblteOsXGGNf6S8cBaP58GXe5V3Lh2pDcrkpugqUPmpzTSDXIrZAUb3FbCOsSMMcbxqMzBLoro08GJ26g5ZCfNdqIMtvBZBuBvWdWkSIvR3ZBxsT3aZAw9SUaiNa9blB5SqqfDsHjeOy4tMFNgvZBWSQgpJv0ZD';
const phone_id = '1307682492428703';
const to = '50231226602';

async function testMeta() {
    let payload = {
        messaging_product: `whatsapp`,
        to: to,
        type: `interactive`,
        interactive: {
            type: `list`,
            header: { type: `text`, text: `Menú Principal` },
            body: { text: `¡Hola! Bienvenido. ¿Cómo podemos ayudarte hoy?` },
            action: {
                button: `Ver opciones 📋`,
                sections: [{ title: `Opciones disponibles`, rows: [
                    { id: `btn_catalogo`, title: `📦 Ver productos` },
                    { id: `btn_faq_0`, title: `Prueba 1` },
                    { id: `btn_faq_1`, title: `prueba 2` },
                    { id: `btn_faq_2`, title: `Prueba 3` }
                ]}]
            }
        }
    };
    
    console.log("Enviando Menu...");
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
