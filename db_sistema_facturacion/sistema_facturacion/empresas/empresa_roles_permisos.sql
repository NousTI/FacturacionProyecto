-- =========================================
-- ROL_PERMISO
-- =========================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.empresa_roles_permisos (
    rol_id UUID NOT NULL REFERENCES sistema_facturacion.empresa_roles(id) ON DELETE CASCADE,

    permiso_id UUID NOT NULL REFERENCES sistema_facturacion.empresa_permisos(id) ON DELETE CASCADE,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Clave primaria compuesta
    PRIMARY KEY (rol_id, permiso_id)
);