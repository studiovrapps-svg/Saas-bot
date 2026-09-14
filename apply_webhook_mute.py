import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

old_webhook_routing = """            // Log incoming message
            await logMessage(tenant.id, from, 'inbound', msgObj.type, user_message || "media");
            

            if (tenant.bot_tier === 1) {"""

new_webhook_routing = """            // Log incoming message
            await logMessage(tenant.id, from, 'inbound', msgObj.type, user_message || "media");
            
            // GLOBAL MUTE CHECK (For human handoff in ANY tier)
            let muteKey = `mute_${tenant.id}_${from}`;
            let muteUntil = chatCache.get(muteKey);
            if (muteUntil && Date.now() < muteUntil) {
                return res.sendStatus(200); // Silent mode active
            }

            if (tenant.bot_tier === 1) {"""

code = code.replace(old_webhook_routing, new_webhook_routing)

old_tier1_mute = """                let cacheKey = `tier1_${tenant.id}_${from}`;
                let state = chatCache.get(cacheKey) || {};

                if (state.muted_until && Date.now() < state.muted_until) {
                    return res.sendStatus(200); 
                }"""
new_tier1_mute = """                let cacheKey = `tier1_${tenant.id}_${from}`;
                let state = chatCache.get(cacheKey) || {};"""
code = code.replace(old_tier1_mute, new_tier1_mute)

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Done webhook mute")
