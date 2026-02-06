-- ===================================================================
-- ÍNDICES EN TABLA FACTURAS
-- ===================================================================
-- Índices para optimizar búsquedas comunes

CREATE INDEX IF NOT EXISTS idx_facturas_empresa_id 
    ON sistema_facturacion.facturas(empresa_id)
    COMMENT 'Búsqueda rápida de facturas por empresa';

CREATE INDEX IF NOT EXISTS idx_facturas_establecimiento_id 
    ON sistema_facturacion.facturas(establecimiento_id)
    COMMENT 'Búsqueda rápida de facturas por establecimiento';

CREATE INDEX IF NOT EXISTS idx_facturas_punto_emision_id 
    ON sistema_facturacion.facturas(punto_emision_id)
    COMMENT 'Búsqueda rápida de facturas por punto de emisión';

CREATE INDEX IF NOT EXISTS idx_facturas_cliente_id 
    ON sistema_facturacion.facturas(cliente_id)
    COMMENT 'Búsqueda rápida de facturas por cliente';

CREATE INDEX IF NOT EXISTS idx_facturas_usuario_id 
    ON sistema_facturacion.facturas(usuario_id)
    COMMENT 'Búsqueda rápida de facturas por usuario';

CREATE INDEX IF NOT EXISTS idx_facturas_estado 
    ON sistema_facturacion.facturas(estado)
    COMMENT 'Búsqueda rápida por estado de emisión (BORRADOR, EMITIDA, ANULADA)';

CREATE INDEX IF NOT EXISTS idx_facturas_estado_pago 
    ON sistema_facturacion.facturas(estado_pago)
    COMMENT 'Búsqueda rápida por estado de pago (PENDIENTE, PAGADO, PARCIAL, VENCIDO)';

CREATE INDEX IF NOT EXISTS idx_facturas_fecha_emision 
    ON sistema_facturacion.facturas(fecha_emision)
    COMMENT 'Búsqueda rápida por fecha de emisión (para rangos de fechas)';

CREATE INDEX IF NOT EXISTS idx_facturas_numero_factura 
    ON sistema_facturacion.facturas(numero_factura)
    COMMENT 'Búsqueda rápida por número de factura (NNN-NNN-NNNNNNNNN)';

CREATE INDEX IF NOT EXISTS idx_facturas_clave_acceso 
    ON sistema_facturacion.facturas(clave_acceso)
    COMMENT 'Búsqueda rápida por clave de acceso SRI';

CREATE INDEX IF NOT EXISTS idx_facturas_numero_autorizacion 
    ON sistema_facturacion.facturas(numero_autorizacion)
    COMMENT 'Búsqueda rápida por número de autorización SRI';

-- ===================================================================
-- ÍNDICES GIN PARA BÚSQUEDAS EN SNAPSHOTS JSON
-- ===================================================================
-- Estos índices permiten búsquedas eficientes dentro de los campos JSONB

CREATE INDEX IF NOT EXISTS idx_facturas_snapshot_empresa 
    ON sistema_facturacion.facturas USING GIN(snapshot_empresa)
    COMMENT 'Búsqueda en datos JSON del snapshot de empresa';

CREATE INDEX IF NOT EXISTS idx_facturas_snapshot_cliente 
    ON sistema_facturacion.facturas USING GIN(snapshot_cliente)
    COMMENT 'Búsqueda en datos JSON del snapshot de cliente';

CREATE INDEX IF NOT EXISTS idx_facturas_snapshot_establecimiento 
    ON sistema_facturacion.facturas USING GIN(snapshot_establecimiento)
    COMMENT 'Búsqueda en datos JSON del snapshot de establecimiento';

CREATE INDEX IF NOT EXISTS idx_facturas_snapshot_punto_emision 
    ON sistema_facturacion.facturas USING GIN(snapshot_punto_emision)
    COMMENT 'Búsqueda en datos JSON del snapshot de punto de emisión';

CREATE INDEX IF NOT EXISTS idx_facturas_snapshot_usuario 
    ON sistema_facturacion.facturas USING GIN(snapshot_usuario)
    COMMENT 'Búsqueda en datos JSON del snapshot de usuario';
