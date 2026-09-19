const pool = require('./src/config/db');

async function updateCatalog() {
    try {
        // ID 9: Kit MMS (img0)
        await pool.query(`UPDATE products SET name = $1, description = $2, price = $3 WHERE id = $4`,
            ["Kit MMS", "30 ml Clorito de sodio + 30 ml Ácido Clorhídrico. Envío gratis.", 299.00, 9]);

        // ID 8: Gotas Dormir Profundo (img1)
        await pool.query(`UPDATE products SET name = $1, description = $2, price = $3 WHERE id = $4`,
            ["Gotas Dormir Profundo", "Presentación de 30 ml. Tratamiento Homeopático (Melatonina, Aconitum, Ashwaganda y 6 Flores de Bach). Envío gratis.", 249.00, 8]);

        // ID 12: DMSO (img3)
        await pool.query(`UPDATE products SET name = $1, description = $2, price = $3 WHERE id = $4`,
            ["DMSO al 70%", "Dimetilsulfóxido al 70% en presentación de 50ml. Envío gratis.", 299.00, 12]);

        // ID 13: CDS Spray o Tópico (img4)
        await pool.query(`UPDATE products SET name = $1, description = $2, price = $3 WHERE id = $4`,
            ["CDS Spray Nasal o Uso Tópico", "CDS en presentación de Spray Nasal o frasco de Uso Tópico. Precio por unidad.", 149.00, 13]);

        // ID 14: Promoción 2 Litros (img5)
        await pool.query(`UPDATE products SET name = $1, description = $2, price = $3 WHERE id = $4`,
            ["Promo 2 Litros CDS", "Compra 1 litro y llévate el segundo a Q150. (Total por 2 litros).", 449.00, 14]);

        // ID 15: CDS 1 Litro (img7)
        await pool.query(`UPDATE products SET name = $1, description = $2, price = $3 WHERE id = $4`,
            ["CDS 1 Litro", "Oxigenador Celular (Dióxido de Cloro) a 3000 ppm. Incluye medidor.", 299.00, 15]);

        // ID 11: CDS 1/2 Litro (img2)
        await pool.query(`UPDATE products SET name = $1, description = $2, price = $3 WHERE id = $4`,
            ["CDS Medio Litro", "Oxigenador Celular (Dióxido de Cloro) a 3000 ppm. Presentación de 1/2 Litro.", 249.00, 11]);

        // ID 16: Protocolo Universal (img6)
        // Set it as inactive maybe? Or just fix the description so it's not bought, but if it's in products, the bot might sell it.
        // I will rename it to "Protocolo C" and make price 0, but maybe better to deactivate it if it's not a real product?
        // Let's leave it active as an informational item but clearly named.
        await pool.query(`UPDATE products SET name = $1, description = $2, price = $3, is_active = $5 WHERE id = $4`,
            ["Imagen: Protocolo C (Universal)", "Instrucciones de cómo tomar CDS (10 ml en 1 litro de agua, cada hora).", 0.00, 16, false]);

        // Add 250ml product just in case? The image lists it as Q229.
        await pool.query(`INSERT INTO products (tenant_id, name, description, price, image_url, is_active) 
                          VALUES ($1, $2, $3, $4, $5, $6)`,
            [2, "CDS 250 ml", "Oxigenador Celular (Dióxido de Cloro) a 3000 ppm. Presentación de 250 ml.", 229.00, 
             "https://saas-bot-media-20260911-011713.s3.us-east-1.amazonaws.com/catalogo/2/fc3eac7aca09bbfaf75d37058730cdf3.jpeg", true]); 
             // used the same image since img2/img7 are the group image

        console.log("Catálogo actualizado con éxito.");
        process.exit(0);
    } catch (e) {
        console.error("Error updating catalog:", e);
        process.exit(1);
    }
}

updateCatalog();
