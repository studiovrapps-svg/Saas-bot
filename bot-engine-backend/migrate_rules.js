require('dotenv').config();
const pool = require('./src/config/db');
const { upsertRuleKnowledge } = require('./src/services/rag.service');

async function migrateRules() {
    try {
        const tenants = await pool.query('SELECT id, business_rules FROM tenants WHERE business_rules IS NOT NULL');
        
        for (const row of tenants.rows) {
            let rules = row.business_rules;
            if (typeof rules === 'string') rules = JSON.parse(rules);
            
            for (let i = 0; i < rules.length; i++) {
                const rule = rules[i];
                console.log(`Vectorizing rule for tenant ${row.id}: ${rule.q}`);
                await upsertRuleKnowledge(row.id, i + 1, rule.q, rule.a, rule.image_url);
            }
        }
        
        console.log("Migration complete.");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}

migrateRules();
