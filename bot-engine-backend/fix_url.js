const pool = require('./src/config/db');
pool.query("UPDATE products SET image_url = 'https://saas-bot-media-20260911-011713.s3.us-east-1.amazonaws.com/catalogo/2/df8e8f13c6488870c260169f752f226a.jpeg' WHERE name = 'CDS 250 ml'").then(() => process.exit(0));
