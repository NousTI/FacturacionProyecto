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
    -- SNAPSHOTS JSON: Auditoría - datos al momento de emisión
    -- Cada referencia se copia como JSON para preservar estado original
    -- =============================================
    snapshot_empresa JSONB NOT NULL 
        COMMENT 'Snapshot empresa: {id, numero_ruc, razon_social, nombre_comercial, email, telefono, direccion, ciudad, provincia}',
    
    snapshot_cliente JSONB NOT NULL
        COMMENT 'Snapshot cliente: {id, tipo_identificacion, numero_identificacion, nombres, apellidos, razon_social, email, telefono, direccion, ciudad, provincia}',
    
    snapshot_establecimiento JSONB NOT NULL
        COMMENT 'Snapshot establecimiento: {id, codigo, nombre, direccion, ciudad, provincia}',
    
    snapshot_punto_emision JSONB NOT NULL
        COMMENT 'Snapshot punto_emision: {id, codigo, nombre, establecimiento_id, secuencial_actual}',
    
    snapshot_usuario JSONB NOT NULL
        COMMENT 'Snapshot usuario: {id, nombre, apellido, email, rol}',

    -- =============================================
    -- INFORMACIÓN SRI (Ecuador)
    -- =============================================
    numero_factura TEXT NOT NULL UNIQUE 
        CHECK (numero_factura ~ '^\d{3}-\d{3}-\d{9}$')
        COMMENT 'Formato: NNN-NNN-NNNNNNNNN',
    
    secuencial_punto_emision INT NOT NULL
        COMMENT 'Número secuencial para este punto de emisión',
    
    clave_acceso VARCHAR(49) UNIQUE
        COMMENT 'Clave de acceso SRI (49 dígitos) - se genera al emitir',
    
    numero_autorizacion VARCHAR(49)
        COMMENT 'Número de autorización SRI - se obtiene tras validación exitosa',
    
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
    fecha_emision DATE NOT NULL
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
        COMMENT 'Retención de Renta',
    
    total NUMERIC(12,2) NOT NULL 
        CHECK (total = ROUND(subtotal_con_iva + propina - descuento - retencion_iva - retencion_renta, 2))
        COMMENT 'Total = subtotal + propina - descuento - retenciones',

    -- =============================================
    -- ESTADOS: Ciclo de vida de la factura
    -- =============================================
    -- BORRADOR: Creada pero aún no emitida al SRI
    -- EMITIDA: Enviada y autorizada por el SRI
    -- ANULADA: Cancelada (ver log_emision_facturas para detalles)
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR' 
        CHECK (estado IN ('BORRADOR', 'EMITIDA', 'ANULADA'))
        COMMENT 'BORRADOR=creada, EMITIDA=autorizada SRI, ANULADA=cancelada',
    
    -- Estado de pago (independiente del estado de emisión)
    -- PENDIENTE: No pagada
    -- PAGADO: Pagada en su totalidad
    -- PARCIAL: Pagada parcialmente
    -- VENCIDO: Pasó fecha vencimiento sin pagar
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' 
        CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'PARCIAL', 'VENCIDO'))
        COMMENT 'PENDIENTE, PAGADO, PARCIAL, VENCIDO',
    
    -- Origen de la factura
    origen VARCHAR(20) 
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

COMMENT ON TABLE sistema_facturacion.facturas IS
'Tabla principal de facturas. Contiene 5 snapshots JSON independientes (empresa, cliente, establecimiento, punto_emision, usuario) para auditoría.';
