const fs = require('fs');
const pool = require('./src/config/db');
const sql = fs.readFileSync('./database/03_add_billing_fields.sql', 'utf8');
pool.query(sql).then(() => {
    console.log('Migration successful');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
