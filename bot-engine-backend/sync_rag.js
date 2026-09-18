require('dotenv').config();
const pool = require('./src/config/db');
const { upsertProductKnowledge } = require('./src/services/rag.service');

async function syncAllProducts() {
    try {
        console.log("Starting massive RAG synchronization with Gemini...");
        
        const result = await pool.query('SELECT * FROM products');
        const products = result.rows;
        
        console.log(`Found ${products.length} products to sync.`);
        
        let successCount = 0;
        let failCount = 0;
        
        // Process sequentially to respect Gemini API rate limits
        for (const product of products) {
            try {
                await upsertProductKnowledge(
                    product.tenant_id,
                    product.id,
                    product.name,
                    product.description,
                    product.price
                );
                successCount++;
                process.stdout.write('.'); // Simple progress indicator
            } catch (err) {
                console.error(`\n[ERROR] Failed to sync product ID ${product.id}:`, err.message);
                failCount++;
            }
            
            // Artificial delay to prevent hitting 429 Too Many Requests (Google AI free tier limit)
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`\nSynchronization complete!`);
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        
    } catch (e) {
        console.error("Fatal error during sync:", e);
    } finally {
        pool.end();
    }
}

syncAllProducts();
