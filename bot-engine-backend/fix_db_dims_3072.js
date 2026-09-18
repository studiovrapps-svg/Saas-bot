require('dotenv').config();
const pool = require('./src/config/db.js');

async function fixTableDimensions() {
    try {
        console.log("Dropping old table and recreating for 3072 dimensions...");
        
        await pool.query('DROP TABLE IF EXISTS knowledge_base CASCADE;');
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id SERIAL PRIMARY KEY,
                tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL, -- 'product' or 'document'
                reference_id INT, -- links to products.id if type is 'product'
                content TEXT NOT NULL, -- The text chunk to embed
                embedding vector(3072), -- Google Gemini embedding-2
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(tenant_id, type, reference_id)
            );
        `;
        await pool.query(createTableQuery);
        console.log("knowledge_base table recreated successfully (3072 dims).");
        
        // Add an HNSW index for fast querying
        const createIndexQuery = `
            CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx ON knowledge_base USING hnsw (embedding vector_cosine_ops);
        `;
        await pool.query(createIndexQuery);
        console.log("HNSW index created successfully.");
        
    } catch (e) {
        console.error("Error setting up pgvector:", e);
    } finally {
        pool.end();
    }
}

fixTableDimensions();
