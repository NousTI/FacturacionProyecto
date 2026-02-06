-- =========================================
-- PUNTO EMISION 
-- ==================================================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.puntos_emision(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    establecimiento_id UUID NOT NULL
        REFERENCES sistema_facturacion.establecimientos(id) ON DELETE CASCADE,

    codigo TEXT NOT NULL CHECK (codigo ~ '^\d{3}$'), -- SRI: Exactamente 3 dígitos (001-999)
    nombre TEXT NOT NULL,

    secuencial_actual INT NOT NULL DEFAULT 1 CHECK (secuencial_actual > 0), -- SRI: Se formatea a 9 dígitos en aplicación

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_punto_emision_establecimiento_codigo
        UNIQUE (establecimiento_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_puntos_emision_establecimiento_id 
    ON sistema_facturacion.puntos_emision(establecimiento_id);