-- =========================================
-- USERS ROLES LOGS (AUDITORÍA DE ROLES)
-- =========================================
-- Registra todos los cambios de roles de los usuarios.
-- Solo INSERT. Nunca UPDATE ni DELETE.
-- =========================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.users_roles_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Usuario al que se le modificó el rol
    user_id UUID NOT NULL
        REFERENCES sistema_facturacion.users(id)
        ON DELETE CASCADE,

    -- Rol afectado
    role_id UUID NOT NULL
        REFERENCES sistema_facturacion.roles(id)
        ON DELETE CASCADE,

    -- Tipo de cambio realizado
    accion TEXT NOT NULL
        CHECK (accion IN ('ROL_ASIGNADO', 'ROL_REMOVIDO')),

    -- Quién realizó la acción
    realizado_por UUID
        REFERENCES sistema_facturacion.users(id)
        ON DELETE SET NULL,

    -- Origen de la acción
    origen TEXT NOT NULL DEFAULT 'SUPERADMIN'
        CHECK (origen IN ('SISTEMA', 'SUPERADMIN')),

    -- Motivo o comentario
    motivo TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historial por usuario
CREATE INDEX IF NOT EXISTS idx_users_roles_logs_user
ON sistema_facturacion.users_roles_logs (user_id);

-- Historial por rol
CREATE INDEX IF NOT EXISTS idx_users_roles_logs_role
ON sistema_facturacion.users_roles_logs (role_id);

-- Auditoría por fecha
CREATE INDEX IF NOT EXISTS idx_users_roles_logs_created_at
ON sistema_facturacion.users_roles_logs (created_at);
