const pool = require('./src/config/db');

async function moveProtocolToFAQ() {
    try {
        await pool.query(`
            INSERT INTO knowledge_base (tenant_id, q, a, image_url)
            VALUES ($1, $2, $3, $4)
        `, [
            2, 
            "Protocolo C o Universal o Cómo tomar el CDS", 
            "Para la mayoría de las enfermedades y desintoxicación usamos el Protocolo C (Protocolo Universal). Añade 10 ml de CDS en 1 litro de agua y bebe una porción cada hora, desde la mañana (ej. 8:00 am) hasta terminar el litro. Te adjunto la imagen con la tabla de horarios.", 
            "https://saas-bot-media-20260911-011713.s3.us-east-1.amazonaws.com/catalogo/2/fc3eac7aca09bbfaf75d37058730cdf3.jpeg"
        ]);

        await pool.query(`DELETE FROM products WHERE id = 16`);

        console.log("Movido a knowledge_base con éxito.");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

moveProtocolToFAQ();
