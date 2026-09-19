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
        // Limpiar locks viejos (más de 1 hora) para no llenar la base de datos (se podría hacer en un cron)
        // Por eficiencia, lo haremos probabilístico (1 en 100 veces)
        if (Math.random() < 0.01) {
            await pool.query(`DELETE FROM webhook_locks WHERE created_at < NOW() - INTERVAL '1 hour'`);
        }

        const result = await pool.query(
            'INSERT INTO webhook_locks (meta_id) VALUES ($1) ON CONFLICT (meta_id) DO NOTHING RETURNING meta_id', 
            [meta_id]
        );
        return result.rowCount > 0;
    }

    async logUsage(tenant_id, promptTokens, completionTokens, costUsd) {
        await pool.query(
            `INSERT INTO usage_logs (tenant_id, prompt_tokens, completion_tokens, cost_usd) VALUES ($1, $2, $3, $4)`,
            [tenant_id, promptTokens, completionTokens, costUsd]
        );
    }

    async getRecentMessagesForAI(tenant_id, customer_phone, limit = 8) {
        const result = await pool.query(
            `SELECT direction, content, sender_type 
             FROM messages 
             WHERE tenant_id = $1 AND customer_phone = $2 AND content IS NOT NULL AND trim(content) != ''
             ORDER BY created_at DESC, id DESC 
             LIMIT $3`,
            [tenant_id, customer_phone, limit]
        );
        return result.rows.reverse().map(row => ({
            role: row.direction === 'inbound' ? 'user' : 'assistant',
            content: row.content
        }));
    }
}

module.exports = new MessageRepository();
