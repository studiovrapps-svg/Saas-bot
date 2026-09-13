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
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    customer_phone VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL, -- 'inbound' (cliente a bot), 'outbound' (bot/agente a cliente)
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'interactive'
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para acelerar las consultas del chat
CREATE INDEX IF NOT EXISTS idx_messages_tenant_phone ON messages(tenant_id, customer_phone);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
`;

pool.query(query).then(() => {
    console.log('Messages table created successfully.');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
