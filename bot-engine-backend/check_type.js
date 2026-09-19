const pool = require('./src/config/db');
pool.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'knowledge_base' AND column_name = 'reference_id'").then(r => { console.log(r.rows); process.exit(0); });
