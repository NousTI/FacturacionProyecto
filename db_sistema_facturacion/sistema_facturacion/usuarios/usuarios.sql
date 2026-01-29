-- =========================================
-- MÓDULO: EMPRESAS
-- TABLA: usuarios
-- Descripción:
-- Perfil del usuario dentro de una empresa
-- (auth centralizado en sistema_facturacion.users)
-- =========================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- FK al sistema de autenticación
    user_id UUID NOT NULL UNIQUE
        REFERENCES sistema_facturacion.users(id)
        ON DELETE CASCADE,

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id)
        ON DELETE CASCADE,

    empresa_rol_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresa_roles(id)
        ON DELETE RESTRICT,

    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    telefono TEXT NOT NULL,

    avatar_url TEXT,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
