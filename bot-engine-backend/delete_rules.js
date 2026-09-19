const pool = require('./src/config/db');
pool.query("DELETE FROM knowledge_base WHERE type = 'rule'").then(() => process.exit(0));
