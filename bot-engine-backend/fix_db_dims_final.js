require('dotenv').config();
const pool = require('./src/config/db.js');

async function fixTableDimensions() {
    try {
        console.log("Dropping old table and recreating for 768 dimensions (with chunk_index)...");
        
        await pool.query('DROP TABLE IF EXISTS knowledge_base CASCADE;');
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id SERIAL PRIMARY KEY,
                tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL, -- 'product' or 'document'
                reference_id INT, -- links to products.id if type is 'product'
                chunk_index INT DEFAULT 0, -- Identifies which part of the document this is
                content TEXT NOT NULL, 
                embedding vector(768), 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(tenant_id, type, reference_id, chunk_index)
            );
        `;
        await pool.query(createTableQuery);
        console.log("knowledge_base table recreated successfully (768 dims, chunking safe).");
        
        // Add an HNSW index for fast querying (Supported for <= 2000 dims)
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
