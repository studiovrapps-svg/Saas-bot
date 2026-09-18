const { GoogleGenerativeAI, TaskType } = require('@google/generative-ai');
const pool = require('../config/db');

let genAI;
let embeddingModel;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Force 768 dimensions to bypass PostgreSQL pgvector 2000-limit for HNSW indexing
    embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
}

/**
 * Generate vector embedding for a given text using Google Gemini
 */
async function generateEmbedding(text, taskType = TaskType.RETRIEVAL_DOCUMENT) {
    if (!embeddingModel) {
        throw new Error("GEMINI_API_KEY no configurada en el servidor.");
    }
    
    const result = await embeddingModel.embedContent({
        content: { parts: [{ text }] },
        taskType: taskType,
        outputDimensionality: 768
    });
    return result.embedding.values; // Array de 768 floats
}

/**
 * Sync a product to the knowledge base (Called when a product is created/updated)
 */
async function upsertProductKnowledge(tenantId, productId, name, description, price) {
    const content = `Producto: ${name}\nPrecio: USD ${price}\nDescripción: ${description || 'Sin descripción'}`;
    const embedding = await generateEmbedding(content, TaskType.RETRIEVAL_DOCUMENT);
    
    // Formatting the vector array for PostgreSQL pgvector
    const embeddingString = `[${embedding.join(',')}]`;

    const sql = `
        INSERT INTO knowledge_base (tenant_id, type, reference_id, chunk_index, content, embedding) 
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (tenant_id, type, reference_id, chunk_index) 
        DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding, created_at = CURRENT_TIMESTAMP
    `;
    await pool.query(sql, [tenantId, 'product', productId, 0, content, embeddingString]);
}

/**
 * Delete a product from knowledge base (Called when a product is deleted)
 */
async function deleteProductKnowledge(tenantId, productId) {
    await pool.query('DELETE FROM knowledge_base WHERE tenant_id = $1 AND type = $2 AND reference_id = $3', [tenantId, 'product', productId]);
}

/**
 * Search the top N most relevant chunks for a given query
 */
async function searchRelevantContext(tenantId, query, limit = 3) {
    if (!query) return [];
    
    try {
        const embedding = await generateEmbedding(query, TaskType.RETRIEVAL_QUERY);
        const embeddingString = `[${embedding.join(',')}]`;

        // Cast explicito a ::vector(768) para PostgreSQL
        const searchSql = `
            SELECT id, type, reference_id, content, 1 - (embedding <=> $1::vector) AS similarity
            FROM knowledge_base
            WHERE tenant_id = $2
            ORDER BY embedding <=> $1::vector
            LIMIT $3
        `;
        
        const result = await pool.query(searchSql, [embeddingString, tenantId, limit]);
        return result.rows;
    } catch (e) {
        console.error("[RAG Error] Búsqueda vectorial falló. Fallback necesario.", e.message);
        return []; // Fallback gracefully if rate-limited or error
    }
}

module.exports = {
    generateEmbedding,
    upsertProductKnowledge,
    deleteProductKnowledge,
    searchRelevantContext
};
