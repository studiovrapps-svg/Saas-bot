const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false } // Requerido para conectarse a AWS de forma externa
});

pool.on('error', (err) => {
  console.error('Error inesperado en el cliente idle de PostgreSQL:', err);
});

module.exports = pool;
