const pool = require('./src/config/db');
const aiService = require('./src/services/ai.service');

// test AI generation
aiService.generateAIResponse(2, '50231226602', 'Que necesito para poder ser un distribudor', { id: 2, name: 'CDS Premium', bot_tier: 2, currency: 'Q', business_vertical: 'Retail' }, 'Sergio').then(r => {
    console.log(r);
    process.exit(0);
});
