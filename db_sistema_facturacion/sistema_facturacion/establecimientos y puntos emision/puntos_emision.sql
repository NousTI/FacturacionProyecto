-- =========================================
-- PUNTO EMISION 
-- =========================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.puntos_emision(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    establecimiento_id UUID NOT NULL
        REFERENCES sistema_facturacion.establecimientos(id) ON DELETE CASCADE,

    -- SRI: Exactamente 3 dígitos (001-999)
    codigo TEXT NOT NULL CHECK (codigo ~ '^\d{3}$'), 
    
    -- Nombre descriptivo (Ej: "Caja Central", "Ventas Online")
    nombre TEXT NOT NULL,

    -- Contacto específico del punto (Opcional, pero útil para el RIDE)
    telefono TEXT,

    -- SECUENCIALES INDEPENDIENTES (Obligatorio para que el SRI no rechace)
    -- Cada tipo de comprobante debe llevar su propia cuenta
    secuencial_factura INT NOT NULL DEFAULT 1 CHECK (secuencial_factura > 0),
    secuencial_nota_credito INT NOT NULL DEFAULT 1 CHECK (secuencial_nota_credito > 0),
    secuencial_nota_debito INT NOT NULL DEFAULT 1 CHECK (secuencial_nota_debito > 0),
    secuencial_retencion INT NOT NULL DEFAULT 1 CHECK (secuencial_retencion > 0),
    secuencial_guia_remision INT NOT NULL DEFAULT 1 CHECK (secuencial_guia_remision > 0),

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unicidad: No pueden existir dos puntos '001' en el mismo establecimiento
    CONSTRAINT uq_punto_emision_establecimiento_codigo
        UNIQUE (establecimiento_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_puntos_emision_establecimiento_id 
    ON sistema_facturacion.puntos_emision(establecimiento_id);

-- Comentario para documentación
COMMENT ON COLUMN sistema_facturacion.puntos_emision.telefono IS 'Teléfono opcional específico para este punto de emisión/caja.';