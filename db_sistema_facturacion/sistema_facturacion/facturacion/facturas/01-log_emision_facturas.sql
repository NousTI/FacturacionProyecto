-- ===================================================================
-- TABLA: log_emision_facturas
-- ===================================================================
-- Auditoría: Rastrean todo lo referente a la emisión al SRI
-- Una factura puede tener múltiples logs si se reintenta
CREATE TABLE IF NOT EXISTS sistema_facturacion.log_emision_facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    facturacion_programada_id UUID REFERENCES public.facturacion_programada(id) ON DELETE SET NULL,
    
    factura_id UUID NOT NULL
        REFERENCES sistema_facturacion.facturas(id) ON DELETE CASCADE,

    -- Tipo de intento: INICIAL, REINTENTO, CONTINGENCIA, RECTIFICACION
    tipo_intento VARCHAR(20) NOT NULL DEFAULT 'INICIAL'
        CHECK (tipo_intento IN ('INICIAL', 'REINTENTO', 'CONTINGENCIA', 'RECTIFICACION'))
        COMMENT 'Tipo de intento de emisión',
    
    -- Estado del intento: EN_PROCESO, EXITOSO, ERROR_VALIDACION, ERROR_CONECTIVIDAD, ERROR_OTRO
    estado VARCHAR(30) NOT NULL
        CHECK (estado IN ('EN_PROCESO', 'EXITOSO', 'ERROR_VALIDACION', 'ERROR_CONECTIVIDAD', 'ERROR_OTRO'))
        COMMENT 'En qué estado resultó el intento',
    
    -- Número secuencial de intento
    intento_numero INT NOT NULL DEFAULT 1 CHECK (intento_numero > 0)
        COMMENT 'Número de intento (1 = primer intento)',
    
    -- Códigos y mensajes de error
    codigo_error VARCHAR(50)
        COMMENT 'Código de error del SRI si aplica',
    
    mensaje_error TEXT
        COMMENT 'Mensaje de error detallado',
    
    -- XMLs para auditoría completa
    xml_enviado TEXT
        COMMENT 'XML que se envió al SRI',
    
    xml_respuesta TEXT
        COMMENT 'XML de respuesta del SRI',
    
    -- Auditoría
    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT
        COMMENT 'Usuario que realizó el intento',
    
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
        COMMENT 'Fecha/hora del intento',
    
    observaciones TEXT
        COMMENT 'Notas adicionales del intento'
);

COMMENT ON TABLE sistema_facturacion.log_emision_facturas IS
'Auditoría de intentos de emisión al SRI. Una factura puede tener múltiples registros si se reintenta.';

-- Índices
CREATE INDEX IF NOT EXISTS idx_log_emision_factura_id 
    ON sistema_facturacion.log_emision_facturas(factura_id)
    COMMENT 'Búsqueda rápida por factura_id';

CREATE INDEX IF NOT EXISTS idx_log_emision_estado 
    ON sistema_facturacion.log_emision_facturas(estado)
    COMMENT 'Búsqueda rápida de intentos por estado';

CREATE INDEX IF NOT EXISTS idx_log_emision_timestamp 
    ON sistema_facturacion.log_emision_facturas(timestamp)
    COMMENT 'Búsqueda rápida por fecha/hora';
