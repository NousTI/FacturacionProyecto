-- =====================================================
-- TABLA: UNIDAD_MEDIDA
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.unidad_medida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(20) NOT NULL UNIQUE
        CHECK (nombre IN ('UNIDAD', 'CAJA', 'BULTO', 'KILO', 'METRO', 'LITRO')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);