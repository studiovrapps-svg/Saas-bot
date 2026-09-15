
const pool = require('./src/config/db');
async function copyTenant() {
  try {
    const res = await pool.query('SELECT * FROM tenants WHERE id = 2');
    const t = res.rows[0];
    
    // Insert new tenant
    const insertRes = await pool.query(
      \INSERT INTO tenants (name, email, password_hash, whatsapp_phone_id, whatsapp_token, bot_tier, system_prompt, business_rules, tier1_greeting, tier1_menu, is_active, max_chats, meta_name, meta_picture) 
       VALUES (\, \, \, \, \, \, \, \, \, \, \, \, \, \) RETURNING id\,
      ['CDS Premium 2', 'copia_' + Date.now() + '@cdspremium2.com', t.password_hash, t.whatsapp_phone_id, t.whatsapp_token, t.bot_tier, t.system_prompt, t.business_rules, t.tier1_greeting, JSON.stringify(t.tier1_menu), t.is_active, t.max_chats, t.meta_name, t.meta_picture]
    );
    
    const newId = insertRes.rows[0].id;
    console.log('Nuevo tenant creado con ID:', newId);
    
    // Copy products
    const prodRes = await pool.query('SELECT * FROM products WHERE tenant_id = 2');
    for (let p of prodRes.rows) {
      await pool.query(
        \INSERT INTO products (tenant_id, name, description, price, image_url, is_active) 
         VALUES (\, \, \, \, \, \)\,
        [newId, p.name, p.description, p.price, p.image_url, p.is_active]
      );
    }
    console.log(prodRes.rows.length + ' productos copiados.');
    
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
copyTenant();

