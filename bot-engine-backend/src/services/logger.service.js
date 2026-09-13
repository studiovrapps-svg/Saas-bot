const pool = require('../config/db');

const logSystemEvent = async ({ tenant_id = null, level = 'INFO', event_type = 'SYSTEM', message, details = {} }) => {
    try {
        await pool.query(
            `INSERT INTO system_logs (tenant_id, level, event_type, message, details) VALUES ($1, $2, $3, $4, $5)`,
            [tenant_id, level, event_type, message, JSON.stringify(details)]
        );
    } catch (error) {
        // Fallback logger if DB insert fails
        console.error("FAILED TO WRITE SYSTEM LOG TO DB:", error);
        console.error(`[${level}] [${event_type}] Tenant: ${tenant_id} | ${message} |`, details);
    }
};

module.exports = {
    logSystemEvent
};
