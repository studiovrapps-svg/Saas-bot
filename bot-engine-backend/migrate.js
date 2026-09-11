const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});
const q = "CREATE TABLE IF NOT EXISTS templates (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, bot_tier INT DEFAULT 1, system_prompt TEXT, business_rules JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);";
pool.query(q).then(() => { console.log('Table templates created'); pool.end(); }).catch(e => { console.error(e); pool.end(); });
