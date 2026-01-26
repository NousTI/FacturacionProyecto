-- =========================================
-- USER SESSIONS (AUTENTICACIÓN)
-- =========================================
-- =========================================
-- USER SESSIONS (JWT + REVOCACIÓN)
-- =========================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Usuario autenticado
    user_id UUID NOT NULL
        REFERENCES sistema_facturacion.users(id)
        ON DELETE CASCADE,

    -- Estado de la sesión
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,

    -- Ciclo de vida de la sesión
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,

    -- Motivo de revocación (opcional pero recomendado)
    revoked_reason TEXT
        CHECK (revoked_reason IN ('LOGOUT','BLOQUEO_CUENTA','PASSWORD_CAMBIADA','SEGURIDAD','EXPIRADA')),

    -- Información de seguridad
    ip_address TEXT,
    user_agent TEXT
);

-- Sesiones por usuario
CREATE INDEX IF NOT EXISTS idx_user_sessions_user
ON sistema_facturacion.user_sessions (user_id);

-- Sesiones válidas
CREATE INDEX IF NOT EXISTS idx_user_sessions_valid
ON sistema_facturacion.user_sessions (is_valid);

-- Expiración de sesiones
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires
ON sistema_facturacion.user_sessions (expires_at);

