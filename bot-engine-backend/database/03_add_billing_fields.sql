-- Migración: Agregar campos de facturación a la tabla tenants
-- Ejecutar en la base de datos SaaS Bot Engine

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS recurrente_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS recurrente_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;

-- Opcional: Actualizar a todos los tenants existentes para que tengan un periodo de gracia
UPDATE tenants 
SET subscription_status = 'active', current_period_end = NOW() + INTERVAL '14 days' 
WHERE subscription_status = 'trial';
