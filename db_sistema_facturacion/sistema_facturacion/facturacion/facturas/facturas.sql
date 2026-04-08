-- ===================================================================
-- TABLA: facturas
-- ===================================================================
-- Tabla Principal - eventos de facturación
-- Mantiene los datos transaccionales, el resto va en logs específicos
-- Estados: BORRADOR (creada pero no emitida), EMITIDA (enviada al SRI), ANULADA (cancelada)
CREATE TABLE IF NOT EXISTS sistema_facturacion.facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referencias a datos maestros
    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    establecimiento_id UUID NOT NULL
        REFERENCES sistema_facturacion.establecimientos(id) ON DELETE RESTRICT,

    punto_emision_id UUID NOT NULL
        REFERENCES sistema_facturacion.puntos_emision(id) ON DELETE RESTRICT,

    cliente_id UUID NOT NULL
        REFERENCES sistema_facturacion.clientes(id) ON DELETE RESTRICT,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,

    facturacion_programada_id UUID
        REFERENCES sistema_facturacion.facturacion_programada(id) ON DELETE SET NULL,

    -- =============================================
    -- INFORMACIÓN SRI (Ecuador)
    -- =============================================
    numero_factura TEXT UNIQUE 
        CHECK (numero_factura ~ '^\d{3}-\d{3}-\d{9}$')
        COMMENT 'Formato: NNN-NNN-NNNNNNNNN',
    
    secuencial_punto_emision INT
        COMMENT 'Número secuencial para este punto de emisión',
    
    clave_acceso VARCHAR(49) UNIQUE
        COMMENT 'Clave de acceso SRI (49 dígitos) - se genera al emitir',
    
    numero_autorizacion VARCHAR(49) UNIQUE
        COMMENT 'Número de autorización SRI - se obtiene tras validación exitosa',
    
    guia_remision TEXT
        COMMENT 'Número de guía de remisión relacionada (Formato: NNN-NNN-NNNNNNNNN)',
    
    -- Tipo de documento SRI: 01=Factura, 04=Nota Crédito, 05=Nota Débito
    tipo_documento VARCHAR(2) DEFAULT '01' 
        CHECK (tipo_documento IN ('01', '04', '05'))
        COMMENT '01=Factura, 04=Nota Crédito, 05=Nota Débito',
    
    -- Ambiente: 1=Prueba, 2=Producción
    ambiente INT DEFAULT 1 
        CHECK (ambiente IN (1, 2))
        COMMENT '1=Prueba (test), 2=Producción',
    
    -- Tipo de emisión: 1=Normal, 2=Contingencia
    tipo_emision INT DEFAULT 1 
        CHECK (tipo_emision IN (1, 2))
        COMMENT '1=Normal, 2=Contingencia',

    -- =============================================
    -- FECHAS
    -- =============================================
    fecha_emision TIMESTAMPTZ NOT NULL
        COMMENT 'Fecha en que se crea/emite la factura',
    
    fecha_vencimiento DATE
        COMMENT 'Fecha de vencimiento del pago',
    
    fecha_autorizacion TIMESTAMPTZ
        COMMENT 'Fecha/hora cuando SRI autoriza la factura',

    -- =============================================
    -- MONTOS CON VALIDACIONES
    -- =============================================
    subtotal_sin_iva NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (subtotal_sin_iva >= 0)
        COMMENT 'Subtotal sin IVA',
    
    subtotal_con_iva NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (subtotal_con_iva >= 0)
        COMMENT 'Subtotal con IVA',

    subtotal_no_objeto_iva NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (subtotal_no_objeto_iva >= 0)
        COMMENT 'Subtotal no objeto de IVA',
    
    subtotal_exento_iva NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (subtotal_exento_iva >= 0)
        COMMENT 'Subtotal exento de IVA',
    
    iva NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (iva >= 0)
        COMMENT 'Impuesto al Valor Agregado',
    
    descuento NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (descuento >= 0)
        COMMENT 'Descuento aplicado',
    
    propina NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (propina >= 0)
        COMMENT 'Propina/Gratificación',
    
    retencion_iva NUMERIC(12,2) DEFAULT 0 
        CHECK (retencion_iva >= 0)
        COMMENT 'Retención de IVA',
    
    retencion_renta NUMERIC(12,2) DEFAULT 0 
        CHECK (retencion_renta >= 0)
        COMMENT 'Retención de Rentaa',
    
    ice NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (ice >= 0)
        COMMENT 'Impuesto a los Consumos Especiales (ICE)',

    total_sin_impuestos NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (total_sin_impuestos >= 0)
        COMMENT 'Suma de todos los subtotales antes de impuestos (nodo totalSinImpuestos SRI)',

    total NUMERIC(12,2) NOT NULL 
        CHECK (total = ROUND(subtotal_sin_iva + subtotal_con_iva + subtotal_no_objeto_iva + subtotal_exento_iva + iva + ice + propina - descuento - retencion_iva - retencion_renta, 2))

        COMMENT 'Total = subtotal(0+15+NoObjeto+Exento) + iva + ice + propina - descuento - retenciones',

    -- =============================================
    -- ESTADOS: Ciclo de vida de la factura
    -- =============================================
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR' 
        CHECK (estado IN ('BORRADOR', 'EN_PROCESO', 'AUTORIZADA', 'DEVUELTA', 'NO_AUTORIZADA', 'ANULADA', 'ERROR_TECNICO'))
        COMMENT 'BORRADOR=creada, EN_PROCESO=enviada al SRI, AUTORIZADA=autorizada SRI, DEVUELTA=error recepción, NO_AUTORIZADA=error legal autorización, ANULADA=cancelada, ERROR_TECNICO=error red',
    
    -- Estado de pago (independiente del estado de emisión)
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' 
        CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'PARCIAL', 'VENCIDO'))
        COMMENT 'PENDIENTE, PAGADO, PARCIAL, VENCIDO',
    
    -- Origen de la factura
    origen VARCHAR(50) 
        CHECK (origen IN ('MANUAL', 'IMPORTADO', 'API', 'FACTURACION_PROGRAMADA'))
        COMMENT 'Cómo se creó: MANUAL, IMPORTADO, API, o FACTURACION_PROGRAMADA',

    -- =============================================
    -- AUDITORÍA
    -- =============================================
    observaciones TEXT
        COMMENT 'Notas y observaciones generales',
    
    razon_anulacion TEXT
        COMMENT 'Motivo si fue anulada',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        COMMENT 'Timestamp de creación',
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        COMMENT 'Timestamp de última modificación'
);