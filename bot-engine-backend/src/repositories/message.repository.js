const pool = require('../config/db');

class MessageRepository {
    async updateDeliveryStatus(meta_id, status) {
        const result = await pool.query(
            `UPDATE messages SET delivery_status = $1 WHERE meta_message_id = $2 RETURNING tenant_id`,
            [status, meta_id]
        );
        return result.rows.length > 0 ? result.rows[0].tenant_id : null;
    }

    async acquireIdempotencyLock(meta_id) {
        // Retorna true si adquiere el lock, lanza error 23505 si ya existe
        await pool.query('INSERT INTO webhook_locks (meta_id) VALUES ($1)', [meta_id]);
        return true;
    }

    async logUsage(tenant_id, promptTokens, completionTokens, costUsd) {
        await pool.query(
            `INSERT INTO usage_logs (tenant_id, prompt_tokens, completion_tokens, cost_usd) VALUES ($1, $2, $3, $4)`,
            [tenant_id, promptTokens, completionTokens, costUsd]
        );
    }
}

module.exports = new MessageRepository();
