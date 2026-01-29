-- =========================================
-- ROL
-- =========================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.empresa_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,

    es_sistema BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Un rol no se repite dentro de la misma empresa
    CONSTRAINT uq_rol_empresa_codigo UNIQUE (empresa_id, codigo)
);
