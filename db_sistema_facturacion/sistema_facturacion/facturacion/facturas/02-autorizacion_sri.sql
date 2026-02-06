-- ===================================================================
-- TABLA: autorizacion_sri
-- ===================================================================
-- Auditoría: Datos de la autorización final del SRI
-- Una factura puede tener una sola autorización exitosa
CREATE TABLE IF NOT EXISTS sistema_facturacion.autorizacion_sri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factura_id UUID NOT NULL
        REFERENCES sistema_facturacion.facturas(id) ON DELETE CASCADE,
    
    CONSTRAINT uq_autorizacion_sri_factura UNIQUE (factura_id)
        COMMENT 'Una sola autorización por factura',

    numero_autorizacion VARCHAR(49) NOT NULL
        COMMENT 'Número de autorización del SRI',
    
    fecha_autorizacion TIMESTAMPTZ NOT NULL
        COMMENT 'Fecha/hora de autorización',
    
    -- Estado de la autorización
    estado VARCHAR(30) NOT NULL
        CHECK (estado IN ('AUTORIZADO', 'NO_AUTORIZADO', 'DEVUELTO', 'CANCELADO'))
        COMMENT 'Estado de la autorización: AUTORIZADO, NO_AUTORIZADO, DEVUELTO, CANCELADO',
    
    mensajes JSONB
        COMMENT 'Mensajes/advertencias del SRI en formato JSON',
    
    xml_enviado TEXT
        COMMENT 'XML original enviado',
    
    xml_respuesta TEXT
        COMMENT 'XML de respuesta del SRI',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        COMMENT 'Timestamp de creación del registro',
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        COMMENT 'Timestamp de actualización'
);

COMMENT ON TABLE sistema_facturacion.autorizacion_sri IS
'Datos de la autorización final del SRI. Una sola autorización por factura.';

-- Índices
CREATE INDEX IF NOT EXISTS idx_autorizacion_sri_factura_id 
    ON sistema_facturacion.autorizacion_sri(factura_id)
    COMMENT 'Búsqueda rápida por factura_id';

CREATE INDEX IF NOT EXISTS idx_autorizacion_sri_numero 
    ON sistema_facturacion.autorizacion_sri(numero_autorizacion)
    COMMENT 'Búsqueda rápida por número de autorización';
