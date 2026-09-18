const fs = require('fs');

// 1. Create table script
const db = require('./src/config/db');
db.query('CREATE TABLE IF NOT EXISTS webhook_locks (meta_id VARCHAR(255) PRIMARY KEY, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);')
  .then(() => console.log("webhook_locks table created"))
  .catch(e => console.error("DB error", e));

// 2. Patch webhook.controller.js
let code = fs.readFileSync('src/controllers/webhook.controller.js', 'utf8');

const anchor = "let msgObj = body.entry[0].changes[0].value.messages[0];";

const idempotencyLogic = `let msgObj = body.entry[0].changes[0].value.messages[0];
              
              // --- PROTECCIÓN ANTI-DUPLICADOS (Idempotencia de Meta) ---
              if (msgObj.id) {
                  try {
                      await pool.query('INSERT INTO webhook_locks (meta_id) VALUES ($1)', [msgObj.id]);
                  } catch (error) {
                      if (error.code === '23505') { // Violación de PRIMARY KEY (Unique)
                          console.log(\`[Idempotencia] 🛡️ Webhook duplicado de Meta bloqueado. wamid: \${msgObj.id}\`);
                          return; // Aborta silenciosamente este hilo, el original ya lo está procesando
                      }
                  }
              }
              // ---------------------------------------------------------
`;

if (!code.includes("INSERT INTO webhook_locks")) {
    code = code.replace(anchor, idempotencyLogic);
    fs.writeFileSync('src/controllers/webhook.controller.js', code);
    console.log("webhook.controller.js idempotency patched!");
} else {
    console.log("Already patched");
}
