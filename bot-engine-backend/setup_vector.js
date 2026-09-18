require('dotenv').config();
const pool = require('./src/config/db.js');

async function testPgVector() {
    try {
        console.log("Checking for pgvector extension...");
        await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log("pgvector is enabled!");
        
        // Let's create a knowledge_base table for RAG
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id SERIAL PRIMARY KEY,
                tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL, -- 'product' or 'document'
                reference_id INT, -- links to products.id if type is 'product'
                content TEXT NOT NULL, -- The text chunk to embed
                embedding vector(1536), -- Assuming OpenAI text-embedding-3-small
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createTableQuery);
        console.log("knowledge_base table created successfully.");
        
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

testPgVector();
