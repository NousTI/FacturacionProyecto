-- =====================================================
-- TABLA: CATEGORIA_GASTO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.categoria_gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,

    tipo TEXT NOT NULL CHECK (tipo IN ('fijo', 'variable', 'operativo', 'financiero')),

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_categoria_gasto_empresa_codigo
        UNIQUE (empresa_id, codigo)
);

CREATE INDEX idx_categoria_gasto_empresa ON sistema_facturacion.categoria_gasto(empresa_id);