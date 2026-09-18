const pool = require('../config/db');

class TenantRepository {
    async getTenantByPhoneId(phone_number_id) {
        const result = await pool.query('SELECT * FROM tenants WHERE whatsapp_phone_id = $1', [phone_number_id]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async getBusinessRules(tenant_id) {
        const result = await pool.query('SELECT business_rules FROM tenants WHERE id = $1', [tenant_id]);
        if (result.rows.length > 0 && result.rows[0].business_rules) {
            try {
                return Array.isArray(result.rows[0].business_rules) 
                    ? result.rows[0].business_rules 
                    : JSON.parse(result.rows[0].business_rules);
            } catch(e) {
                return [];
            }
        }
        return [];
    }
}

module.exports = new TenantRepository();
