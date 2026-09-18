const pool = require('../config/db');

class SessionRepository {
    async getSessionState(tenant_id, user_phone) {
        const res = await pool.query('SELECT state_data, status, customer_name FROM chat_sessions WHERE tenant_id = $1 AND user_phone = $2', [tenant_id, user_phone]);
        if (res.rows.length > 0) {
            return {
                state: res.rows[0].state_data || {},
                status: res.rows[0].status,
                customer_name: res.rows[0].customer_name
            };
        }
        return { state: {}, status: 'bot', customer_name: null };
    }

    async setCustomerName(tenant_id, user_phone, name) {
        await pool.query(
            `INSERT INTO chat_sessions (tenant_id, user_phone, customer_name) VALUES ($1, $2, $3) 
             ON CONFLICT (tenant_id, user_phone) 
             DO UPDATE SET customer_name = $3, last_interaction = NOW()`,
            [tenant_id, user_phone, name]
        );
    }

    async setSessionState(tenant_id, user_phone, newState) {
        await pool.query(
            `INSERT INTO chat_sessions (tenant_id, user_phone, state_data) VALUES ($1, $2, $3) 
             ON CONFLICT (tenant_id, user_phone) 
             DO UPDATE SET state_data = $3, last_interaction = NOW()`,
            [tenant_id, user_phone, JSON.stringify(newState)]
        );
    }

    async clearSessionState(tenant_id, user_phone) {
        await pool.query(
            'UPDATE chat_sessions SET state_data = $3 WHERE tenant_id = $1 AND user_phone = $2', 
            [tenant_id, user_phone, JSON.stringify({})]
        );
    }

    async setHumanStatus(tenant_id, user_phone, mutedUntilTimestamp) {
        await pool.query(
            `INSERT INTO chat_sessions (tenant_id, user_phone, status, state_data) VALUES ($1, $2, 'humano', $3) 
             ON CONFLICT (tenant_id, user_phone) 
             DO UPDATE SET status = 'humano', last_interaction = NOW(), state_data = jsonb_set(COALESCE(chat_sessions.state_data, '{}'), '{muted_until}', $4::jsonb)`,
            [tenant_id, user_phone, JSON.stringify({ muted_until: mutedUntilTimestamp }), mutedUntilTimestamp.toString()]
        );
    }
}

module.exports = new SessionRepository();
