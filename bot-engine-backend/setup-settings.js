const pool = require('./src/config/db');
async function run() {
  await pool.query(`CREATE TABLE IF NOT EXISTS settings (key VARCHAR(50) PRIMARY KEY, value JSONB)`);
  await pool.query(`INSERT INTO settings (key, value) VALUES ('pricing', '{"plans":{"1":299,"2":499,"3":999},"modules":{"orders":200,"inbox":150,"crm":100,"campaigns":250}}') ON CONFLICT (key) DO NOTHING`);
  console.log('done');
  process.exit(0);
}
run();
