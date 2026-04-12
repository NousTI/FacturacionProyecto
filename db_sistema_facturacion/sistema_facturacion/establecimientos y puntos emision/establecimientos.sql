-- =========================================
-- ESTABLECIMIENTO 
-- =========================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.establecimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    -- SRI: Exactamente 3 dígitos (001-999) [cite: 18, 527]
    codigo TEXT NOT NULL CHECK (codigo ~ '^\d{3}$'), 
    
    -- Nombre comercial específico del local (Ej: "Sucursal Loja Sur") 
    nombre TEXT NOT NULL, 
    
    -- Dirección exacta del local (Debe constar en el RUC) 
    direccion TEXT NOT NULL,

    -- NUEVO: Identificador de Matriz para lógica de XML
    es_matriz BOOLEAN NOT NULL DEFAULT FALSE,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unicidad: No pueden existir dos locales '001' para el mismo RUC
    CONSTRAINT uq_establecimientos_empresa_codigo
        UNIQUE (empresa_id, codigo)
);

-- Índice para búsquedas rápidas de locales por empresa
CREATE INDEX IF NOT EXISTS idx_establecimientos_empresa_id 
    ON sistema_facturacion.establecimientos(empresa_id);

-- Comentario para documentación
COMMENT ON TABLE sistema_facturacion.establecimientos IS 'Locales físicos registrados en el RUC (001, 002, etc.) para emisión de comprobantes.';