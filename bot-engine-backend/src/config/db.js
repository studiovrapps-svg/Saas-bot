const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  max: 20, // max number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
  ssl: { rejectUnauthorized: false } // Requerido para conectarse a AWS de forma externa
});

pool.on('error', (err) => {
  console.error('Error inesperado en el cliente idle de PostgreSQL:', err);
});

module.exports = pool;
