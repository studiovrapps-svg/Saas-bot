const pool = require('./src/config/db');

async function moveProtocolToRules() {
    try {
        const res = await pool.query('SELECT business_rules FROM tenants WHERE id = 2');
        let rules = res.rows[0].business_rules || [];
        if (typeof rules === 'string') rules = JSON.parse(rules);

        rules.push({
            q: "Protocolo C o Universal o Cómo tomar el CDS",
            a: "Para la mayoría de las enfermedades y desintoxicación usamos el Protocolo C (Protocolo Universal). Añade 10 ml de CDS en 1 litro de agua y bebe una porción cada hora, desde la mañana (ej. 8:00 am) hasta terminar el litro. Te adjunto la imagen con la tabla de horarios.",
            image_url: "https://saas-bot-media-20260911-011713.s3.us-east-1.amazonaws.com/catalogo/2/fc3eac7aca09bbfaf75d37058730cdf3.jpeg"
        });

        await pool.query('UPDATE tenants SET business_rules = $1 WHERE id = 2', [JSON.stringify(rules)]);
        await pool.query('DELETE FROM products WHERE id = 16');

        console.log("Regla añadida y producto eliminado.");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

moveProtocolToRules();
