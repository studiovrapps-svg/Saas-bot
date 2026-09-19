-- schema.sql: Estructura Base de Datos Multi-Tenant para el SaaS de Bots

-- 1. Tabla de Empresas/Clientes (Los inquilinos de tu SaaS)
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    whatsapp_phone_id VARCHAR(100),
    whatsapp_token TEXT,
    bot_tier INT DEFAULT 1,
    system_prompt TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    monthly_price DECIMAL(10, 2) DEFAULT 50.00,
    currency VARCHAR(10) DEFAULT 'Q',
    business_vertical VARCHAR(50) DEFAULT 'ecommerce',
    tier1_menu JSONB DEFAULT '[]'::jsonb,
    tier1_greeting TEXT,
    checkout_message TEXT,
    telegram_chat_id VARCHAR(100),
    features JSONB DEFAULT '{}'::jsonb,
    business_rules JSONB DEFAULT '[]'::jsonb,
    meta_name VARCHAR(255),
    meta_picture TEXT,
    recurrente_customer_id VARCHAR(255),
    recurrente_subscription_id VARCHAR(255),
    subscription_status VARCHAR(50),
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Productos
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Sesiones de Chat
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    user_phone VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'bot',
    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    state_data JSONB DEFAULT '{}'::jsonb,
    UNIQUE(tenant_id, user_phone)
);

CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY, 
    name VARCHAR(255) NOT NULL, 
    description TEXT,
    bot_tier INT DEFAULT 1, 
    system_prompt TEXT, 
    business_rules JSONB DEFAULT '[]'::jsonb, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_jobs (
    id SERIAL PRIMARY KEY, 
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE, 
    campaign_name VARCHAR(255) NOT NULL, 
    target_phones JSONB NOT NULL, 
    status VARCHAR(50) DEFAULT 'pending', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Bloqueos de Webhook (Idempotencia)
CREATE TABLE IF NOT EXISTS webhook_locks (
    meta_id VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tablas Críticas Añadidas en Ronda 2
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    customer_phone VARCHAR(50),
    direction VARCHAR(10),
    message_type VARCHAR(50),
    content TEXT,
    meta_id VARCHAR(255),
    delivery_status VARCHAR(50),
    customer_name VARCHAR(255),
    sender_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    customer_phone VARCHAR(50),
    items JSONB NOT NULL,
    delivery_address TEXT,
    status VARCHAR(50) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usage_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    cost_usd DECIMAL(14, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    level VARCHAR(20),
    message TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Base de Conocimientos Vectorial (Asumiendo pgvector ya activado con CREATE EXTENSION vector)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50),
    reference_id INT REFERENCES products(id) ON DELETE CASCADE,
    chunk_index INT,
    content TEXT,
    embedding vector(768),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, type, reference_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_tenant_phone ON messages(tenant_id, customer_phone);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_tenant ON chat_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_tenant ON usage_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_tenant ON system_logs(tenant_id);
