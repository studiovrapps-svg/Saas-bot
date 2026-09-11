const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function initDB() {
  try {
    console.log("Conectando a AWS RDS...");
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log("¡Éxito! Las tablas Multi-Tenant fueron creadas en AWS.");
  } catch (err) {
    console.error("Error creando tablas:", err);
  } finally {
    pool.end();
  }
}

initDB();
