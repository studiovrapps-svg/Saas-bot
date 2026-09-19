const pool = require('./src/config/db');
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'knowledge_base'").then(r => {
    console.log(r.rows.map(x=>x.column_name));
    process.exit(0);
});
