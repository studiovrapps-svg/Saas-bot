-- schema.sql: Estructura Base de Datos Multi-Tenant para el SaaS de Bots

-- 1. Tabla de Empresas/Clientes (Los inquilinos de tu SaaS)
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,                  -- Ej: "CDS Premium"
    email VARCHAR(255) UNIQUE NOT NULL,          -- Para que el cliente inicie sesión en el Panel React
    password_hash VARCHAR(255),                  -- Contraseña del cliente (encriptada)
    whatsapp_phone_id VARCHAR(100),              -- ID del número de WhatsApp asignado
    whatsapp_token TEXT,                         -- Token de Meta para enviar mensajes
    bot_tier INT DEFAULT 1,                      -- 1: Menú Básico, 2: Flujos, 3: IA Avanzada
    system_prompt TEXT,                          -- Instrucciones para la IA (Solo nivel 2 y 3)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Productos (Reemplazo del Google Sheets)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,                  -- Ej: "Kit MMS"
    description TEXT,
    price DECIMAL(10, 2),                        -- Ej: 299.00
    image_url TEXT,                              -- Link de AWS S3
    is_active BOOLEAN DEFAULT TRUE,              -- Para ocultar/mostrar productos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Sesiones de Chat (Para manejar el Handoff al Humano)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    user_phone VARCHAR(50) NOT NULL,             -- El número de la persona que escribe al bot
    status VARCHAR(20) DEFAULT 'bot',            -- 'bot' o 'humano'
    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    state_data JSONB DEFAULT '{}'::jsonb,        -- Estado temporal para el bot (ej. carrito)
    UNIQUE(tenant_id, user_phone)                -- Para no tener sesiones duplicadas
);
CREATE TABLE IF NOT EXISTS templates (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, bot_tier INT DEFAULT 1, system_prompt TEXT, business_rules JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS campaign_jobs (id SERIAL PRIMARY KEY, tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE, campaign_name VARCHAR(255) NOT NULL, target_phones JSONB NOT NULL, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
-- 4. Tabla de Bloqueos de Webhook (Anti-Duplicados / Idempotencia)
CREATE TABLE IF NOT EXISTS webhook_locks (
    meta_id VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
