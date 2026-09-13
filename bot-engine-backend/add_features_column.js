const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

const query = `
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{"inbox": false, "orders": true}'::jsonb;

-- Migrar la lógica de tier (1 vs 2) a features si es necesario, 
-- pero por ahora solo aseguramos que la columna exista.
`;

pool.query(query).then(() => {
    console.log('Features column added successfully.');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
