const pool = require('../config/db');

class SessionRepository {
    async getSessionState(tenant_id, user_phone) {
        const res = await pool.query('SELECT state_data, status FROM chat_sessions WHERE tenant_id = $1 AND user_phone = $2', [tenant_id, user_phone]);
        if (res.rows.length > 0) {
            return {
                state: res.rows[0].state_data || {},
                status: res.rows[0].status
            };
        }
        return { state: {}, status: 'bot' };
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
