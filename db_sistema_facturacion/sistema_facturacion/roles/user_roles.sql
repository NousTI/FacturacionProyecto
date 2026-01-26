-- =========================================
-- RELACIÓN USUARIOS - ROLES
-- =========================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES sistema_facturacion.users(id)
        ON DELETE CASCADE,

    role_id UUID NOT NULL
        REFERENCES sistema_facturacion.roles(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, role_id)
);
