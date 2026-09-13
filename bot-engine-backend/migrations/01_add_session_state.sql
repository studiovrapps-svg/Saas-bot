-- 01_add_session_state.sql

-- Añadir columna de estado a chat_sessions
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS state_data JSONB DEFAULT '{}'::jsonb;

-- Tabla para encolar envíos masivos
CREATE TABLE IF NOT EXISTS campaign_jobs (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    target_phones JSONB NOT NULL, -- array de números
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
