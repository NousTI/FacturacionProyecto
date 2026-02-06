-- =========================================
-- ESTABLECIMIENTO 
-- ==================================================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.establecimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    codigo TEXT NOT NULL CHECK (codigo ~ '^\d{3}$'), -- SRI: Exactamente 3 dígitos (001-999)
    nombre TEXT NOT NULL,
    direccion TEXT NOT NULL,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_establecimientos_empresa_codigo
        UNIQUE (empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_establecimientos_empresa_id 
    ON sistema_facturacion.establecimientos(empresa_id);
