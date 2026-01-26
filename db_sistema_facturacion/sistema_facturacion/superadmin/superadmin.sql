-- =========================================
-- SUPERADMIN (PERFIL)
-- =========================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.superadmin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relación con la identidad (AUTH)
    user_id UUID NOT NULL UNIQUE
        REFERENCES sistema_facturacion.users(id)
        ON DELETE CASCADE,

    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,

    -- Estado del perfil (NO del login)
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
