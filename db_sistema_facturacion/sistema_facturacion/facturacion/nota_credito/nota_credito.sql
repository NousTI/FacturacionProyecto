-- ===================================================================
-- TABLA: notas_credito
-- ===================================================================
-- Tabla para anulación de facturas (SRI Código 04)
-- Mantiene la información requerida para el comprobante electrónico de Nota de Crédito
-- ===================================================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.notas_credito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vínculo con la factura original
    factura_id UUID NOT NULL 
        REFERENCES sistema_facturacion.facturas(id) ON DELETE RESTRICT,
    
    -- Datos del Comprobante (Requerido por SRI)
    establecimiento CHAR(3) NOT NULL, -- Ej: '001'
    punto_emision CHAR(3) NOT NULL,    -- Ej: '100'
    secuencial CHAR(9) NOT NULL,       -- Ej: '000000001'
    
    clave_acceso VARCHAR(49) UNIQUE,
    numero_autorizacion VARCHAR(49) UNIQUE,
    fecha_emision TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    estado_sri VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado_sri IN ('PENDIENTE', 'RECIBIDO', 'AUTORIZADO', 'RECHAZADO', 'DEVUELTA', 'ANULADA')),

    -- Ambiente: 1=Prueba, 2=Producción
    ambiente INT DEFAULT 1 
        CHECK (ambiente IN (1, 2)),
    
    -- Tipo de emisión: 1=Normal, 2=Contingencia
    tipo_emision INT DEFAULT 1 
        CHECK (tipo_emision IN (1, 2)),
    
    -- Información de Modificación (Referencia obligatoria a la factura original)
    cod_doc_modificado VARCHAR(2) NOT NULL DEFAULT '01'
        CHECK (cod_doc_modificado = '01'),
        
    num_doc_modificado VARCHAR(17) NOT NULL,
    fecha_emision_docs_modificado DATE NOT NULL,
    motivo_anulacion TEXT NOT NULL,
    
    -- Totales (Basados en la estructura de facturas)
    subtotal_15_iva NUMERIC(12,2) NOT NULL DEFAULT 0.00
        CHECK (subtotal_15_iva >= 0),
        
    subtotal_0_iva NUMERIC(12,2) NOT NULL DEFAULT 0.00
        CHECK (subtotal_0_iva >= 0),
        
    iva_total NUMERIC(12,2) NOT NULL DEFAULT 0.00
        CHECK (iva_total >= 0),
        
    valor_total_anulado NUMERIC(12,2) NOT NULL
        CHECK (valor_total_anulado >= 0),
    
    -- Metadatos de auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentarios de columnas NC
COMMENT ON TABLE sistema_facturacion.notas_credito IS 'Tabla para el registro y gestión de Notas de Crédito para anulación de facturas';
COMMENT ON COLUMN sistema_facturacion.notas_credito.clave_acceso IS 'Clave de acceso de 49 dígitos generada para el SRI';
COMMENT ON COLUMN sistema_facturacion.notas_credito.numero_autorizacion IS 'Número de autorización recibido del SRI';
COMMENT ON COLUMN sistema_facturacion.notas_credito.estado_sri IS 'Estado del comprobante ante el SRI';
COMMENT ON COLUMN sistema_facturacion.notas_credito.ambiente IS '1=Prueba (test), 2=Producción';
COMMENT ON COLUMN sistema_facturacion.notas_credito.tipo_emision IS '1=Normal, 2=Contingencia';
COMMENT ON COLUMN sistema_facturacion.notas_credito.cod_doc_modificado IS 'Siempre 01 para facturas';
COMMENT ON COLUMN sistema_facturacion.notas_credito.num_doc_modificado IS 'Formato: 001-100-000000456';
COMMENT ON COLUMN sistema_facturacion.notas_credito.fecha_emision_docs_modificado IS 'Fecha de emisión de la factura que se modifica';
COMMENT ON COLUMN sistema_facturacion.notas_credito.motivo_anulacion IS 'Razón de la anulación (Máx 300 caracteres según RIDE)';

-- ===================================================================
-- TABLA: notas_credito_detalle
-- ===================================================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.notas_credito_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    nota_credito_id UUID NOT NULL
        REFERENCES sistema_facturacion.notas_credito(id) ON DELETE CASCADE,
        
    factura_detalle_id UUID
        REFERENCES sistema_facturacion.facturas_detalle(id) ON DELETE SET NULL,
    
    -- Réplica de datos del ítem para persistencia (por si el producto cambia)
    producto_id UUID
        REFERENCES sistema_facturacion.productos(id) ON DELETE SET NULL,
        
    codigo_producto TEXT NOT NULL,
    nombre TEXT NOT NULL,
    
    cantidad INT NOT NULL
        CHECK (cantidad > 0),
        
    precio_unitario NUMERIC(16,6) NOT NULL
        CHECK (precio_unitario >= 0),
        
    descuento NUMERIC(12,2) NOT NULL DEFAULT 0,
    
    subtotal NUMERIC(12,2) NOT NULL
        CHECK (subtotal >= 0),
        
    valor_iva NUMERIC(12,2) NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN sistema_facturacion.notas_credito_detalle.factura_detalle_id IS 'Referencia opcional al detalle original de la factura para trazabilidad';

-- Índices
CREATE INDEX IF NOT EXISTS idx_nc_factura_id ON sistema_facturacion.notas_credito(factura_id);
CREATE INDEX IF NOT EXISTS idx_ncd_nc_id ON sistema_facturacion.notas_credito_detalle(nota_credito_id);

-- ===================================================================
-- TABLA: log_emision_notas_credito
-- ===================================================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.log_emision_notas_credito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    nota_credito_id UUID NOT NULL 
        REFERENCES sistema_facturacion.notas_credito(id) ON DELETE CASCADE,

    ambiente SMALLINT NOT NULL 
        CHECK (ambiente IN (1, 2)),
        
    tipo_intento VARCHAR(30) NOT NULL DEFAULT 'INICIAL'
        CHECK (tipo_intento IN ('INICIAL', 'REINTENTO', 'CONTINGENCIA', 'RECTIFICACION', 'CONSULTA')),
        
    intento_numero INT NOT NULL DEFAULT 1 
        CHECK (intento_numero >= 0),
        
    clave_acceso VARCHAR(49),

    estado VARCHAR(30) NOT NULL
        CHECK (estado IN ('EN_PROCESO', 'EXITOSO', 'ERROR_VALIDACION', 'ERROR_CONECTIVIDAD', 'ERROR_SISTEMA')),
        
    sri_estado_raw VARCHAR(30),

    fase_falla VARCHAR(30) 
        CHECK (fase_falla IN ('RECEPCION', 'AUTORIZACION', 'FIRMA', 'SISTEMA', 'AUTORIZACION_CONSULTA')),
        
    duracion_ms INT,
    
    mensajes JSONB NOT NULL DEFAULT '[]'::jsonb,
    client_info JSONB NOT NULL DEFAULT '{}'::jsonb,

    notificado_cliente BOOLEAN DEFAULT FALSE,
    mensaje_notificacion TEXT,

    xml_enviado TEXT,
    xml_respuesta TEXT,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,
        
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN sistema_facturacion.log_emision_notas_credito.ambiente IS '1=PRUEBAS, 2=PRODUCCION';
COMMENT ON COLUMN sistema_facturacion.log_emision_notas_credito.clave_acceso IS 'Clave de acceso única enviada en este intento';
COMMENT ON COLUMN sistema_facturacion.log_emision_notas_credito.estado IS 'Estado interno simplificado para el sistema';
COMMENT ON COLUMN sistema_facturacion.log_emision_notas_credito.sri_estado_raw IS 'Estado crudo devuelto por el WS SRI';
COMMENT ON COLUMN sistema_facturacion.log_emision_notas_credito.duracion_ms IS 'Tiempo de respuesta del SRI en ms';
COMMENT ON COLUMN sistema_facturacion.log_emision_notas_credito.mensajes IS 'Lista de errores/advertencias del SRI';
COMMENT ON COLUMN sistema_facturacion.log_emision_notas_credito.client_info IS 'IP, User Agent del usuario que emite';

CREATE INDEX IF NOT EXISTS idx_log_nc_id ON sistema_facturacion.log_emision_notas_credito(nota_credito_id);

-- ===================================================================
-- TABLA: autorizaciones_sri_notas_credito
-- ===================================================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.autorizaciones_sri_notas_credito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nota_credito_id UUID NOT NULL
        REFERENCES sistema_facturacion.notas_credito(id) ON DELETE CASCADE,
    
    CONSTRAINT uq_autorizacion_sri_nc UNIQUE (nota_credito_id),

    numero_autorizacion VARCHAR(49) NOT NULL,
    fecha_autorizacion TIMESTAMPTZ NOT NULL,
    
    estado VARCHAR(30) NOT NULL
        CHECK (estado IN ('AUTORIZADO', 'NO_AUTORIZADO', 'DEVUELTO', 'CANCELADO')),
    
    mensajes JSONB,
    xml_enviado TEXT,
    xml_respuesta TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autorizacion_sri_nc_id 
    ON sistema_facturacion.autorizaciones_sri_notas_credito(nota_credito_id);
