require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There is no getGenerativeModel list, we can try querying or just test 'embedding-001'
    const modelNames = ['text-embedding-004', 'embedding-001', 'models/embedding-001'];
    
    for (const m of modelNames) {
        try {
            console.log("Trying", m);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.embedContent("Hello world");
            console.log(`✅ Success with ${m}, length: ${result.embedding.values.length}`);
            return;
        } catch (e) {
            console.error(`❌ Failed ${m}:`, e.message);
        }
    }
}
listModels();
