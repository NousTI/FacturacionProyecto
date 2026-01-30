-- =====================================================
-- TABLA: configuracion_sri_audit_logs
-- Auditoría de cambios en la configuración SRI
-- =====================================================

CREATE TABLE sistema_facturacion.configuraciones_sri_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Configuración afectada
    configuracion_sri_id UUID NOT NULL
        REFERENCES sistema_facturacion.configuraciones_sri(id) ON DELETE CASCADE,

    -- Empresa a la que pertenece
    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    -- Usuario que realizó el cambio (NULL = sistema)
    user_id UUID
        REFERENCES sistema_facturacion.users(id),

    -- Rol del usuario al momento del cambio (snapshot) (si aplica)
    rol_empresa TEXT,

    -- Rol del usuario al momento del cambio (snapshot) (si aplica)
    rol_sistema TEXT,

    -- Tipo de acción realizada
    accion TEXT NOT NULL
        CHECK (accion IN ('CREATE', 'UPDATE', 'DELETE')),

    -- Estado ANTES del cambio
    snapshot_before JSONB,

    -- Estado DESPUÉS del cambio
    snapshot_after JSONB,

    -- Metadata opcional
    ip_origen INET,
    user_agent TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX idx_sri_audit_logs_config
    ON sistema_facturacion.configuraciones_sri_audit_logs (configuracion_sri_id);

CREATE INDEX idx_sri_audit_logs_empresa
    ON sistema_facturacion.configuraciones_sri_audit_logs (empresa_id);

CREATE INDEX idx_sri_audit_logs_user
    ON sistema_facturacion.configuraciones_sri_audit_logs (user_id);

CREATE INDEX idx_sri_audit_logs_fecha
    ON sistema_facturacion.configuraciones_sri_audit_logs (created_at);


-- SUPERADMIN
-- {
--   "user_id": "...",
--   "rol_sistema": "SUPERADMIN",
--   "rol_empresa": null
-- }

-- EMPRESA_ADMIN
-- {
--   "user_id": "...",
--   "rol_empresa": "EMPRESA_ADMIN",
--   "rol_sistema": null
-- }

-- SOPORTE
-- {
--   "user_id": "...",
--   "rol_empresa": "EMPRESA_ADMIN",
--   "rol_sistema": "SOPORTE"
-- }

-- SISTEMA
-- {
--   "user_id": null,
--   "rol_empresa": null,
--   "rol_sistema": null
-- }


-- 🧾 Snapshot recomendado (estructura)
-- {
--   "ambiente": "PRODUCCION",
--   "tipo_emision": "NORMAL",

--   "estado": "ACTIVO",

--   "fecha_expiracion_cert": "2026-05-10T00:00:00Z",

--   "cert_serial": "5A3F9C...",
--   "cert_emisor": "BANCO CENTRAL DEL ECUADOR",
--   "cert_sujeto": "EMPRESA XYZ S.A.",

--   "updated_at": "2026-01-29T18:44:00Z"
-- }
