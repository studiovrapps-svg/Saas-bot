import sys, re

file_path = './src/controllers/inbox.controller.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_funcs = '''
const getChatSession = async (req, res) => {
    try {
        const result = await pool.query('SELECT status, state_data FROM chat_sessions WHERE tenant_id =  AND user_phone = ', [req.params.id, req.params.phone]);
        res.json(result.rows[0] || { status: 'bot' });
    } catch (error) { res.status(500).json({ error: 'Error interno' }); }
};

const toggleBotStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const tenant_id = req.params.id;
        const to = req.params.phone;
        let muteUntil = status === 'humano' ? Date.now() + (2 * 60 * 60 * 1000) : 0;
        
        if (status === 'bot') {
            await pool.query(
                "UPDATE chat_sessions SET status = 'bot', state_data = state_data - 'muted_until' WHERE tenant_id =  AND user_phone = ",
                [tenant_id, to]
            );
        } else {
            await pool.query(
                "INSERT INTO chat_sessions (tenant_id, user_phone, status, state_data) VALUES (, , 'humano', ) ON CONFLICT (tenant_id, user_phone) DO UPDATE SET status = 'humano', state_data = jsonb_set(COALESCE(chat_sessions.state_data, '{}'), '{muted_until}', ::jsonb)",
                [tenant_id, to, JSON.stringify({ muted_until: muteUntil }), str(muteUntil)]
            );
        }
        res.json({ message: 'OK' });
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Error interno' });
    }
};

module.exports = { getChats, getChatMessages, sendReply, getChatSession, toggleBotStatus };
'''

content = content.replace('module.exports = { getChats, getChatMessages, sendReply };', new_funcs)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Update routes
routes_path = './src/routes/inbox.routes.js'
with open(routes_path, 'r', encoding='utf-8') as f:
    rcontent = f.read()

rcontent = rcontent.replace('module.exports = router;', '''router.get('/:id/chats/:phone/session', inboxController.getChatSession);
router.post('/:id/chats/:phone/toggle', inboxController.toggleBotStatus);
module.exports = router;''')

with open(routes_path, 'w', encoding='utf-8') as f:
    f.write(rcontent)
print("Backend updated")
