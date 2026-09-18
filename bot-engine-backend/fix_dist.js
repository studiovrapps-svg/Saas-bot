const { Pool } = require('pg');
const pool = new Pool({ host: 'bot-engine-db.ckl4ym6usta7.us-east-1.rds.amazonaws.com', user: 'postgresadmin', password: 'SaaSBotEngine2026!', database: 'postgres', port: 5432, ssl: { rejectUnauthorized: false } });

async function fixDistributor() {
    try {
        const res = await pool.query(`SELECT tier1_menu FROM tenants WHERE id = 3`);
        let menu = res.rows[0].tier1_menu;
        if (typeof menu === 'string') menu = JSON.parse(menu);
        
        let distOpt = menu.find(m => m.title && m.title.includes('Ser distribuidor'));
        if (distOpt) {
            distOpt.action = 'transfer';
        }
        
        await pool.query(`UPDATE tenants SET tier1_menu = $1 WHERE id = 3`, [JSON.stringify(menu)]);
        console.log('Distribuidor arreglado');
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
fixDistributor();
