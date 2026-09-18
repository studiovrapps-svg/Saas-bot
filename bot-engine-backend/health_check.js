const tenantRepo = require('./src/repositories/tenant.repository');
const productRepo = require('./src/repositories/product.repository');
const sessionRepo = require('./src/repositories/session.repository');
const db = require('./src/config/db');

async function runTests() {
    console.log("Iniciando Pruebas de Integración (Health Check)...");
    try {
        // 1. Test Tenant Repo
        const tenant = await tenantRepo.getTenantByPhoneId('test_phone_id_fake');
        console.log("✅ Tenant Repository: OK");

        // 2. Test Product Repo (N+1 Refactor)
        const products = await productRepo.findProductsByName(1, ['%test%']);
        console.log("✅ Product Repository: OK");

        // 3. Test Session Repo
        const session = await sessionRepo.getSessionState(1, '5215555555555');
        console.log("✅ Session Repository: OK");

        console.log("🚀 TODAS LAS CAPAS DE DATOS RESPONDEN CORRECTAMENTE.");
        process.exit(0);
    } catch (e) {
        console.error("❌ ERROR EN LA ARQUITECTURA:", e);
        process.exit(1);
    }
}

runTests();
