-- ===================================================================
-- TABLA: log_pago_facturas
-- ===================================================================
-- Auditoría: Rastrean todo lo referente al pago
-- Una factura puede tener múltiples pagos si se paga en cuotas
CREATE TABLE IF NOT EXISTS sistema_facturacion.log_pago_facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factura_id UUID NOT NULL
        REFERENCES sistema_facturacion.facturas(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT
        COMMENT 'Usuario que registró el pago',
    
    -- Pago
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0)
        COMMENT 'Monto pagado',
    
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE
        COMMENT 'Fecha del pago',
    
    -- Método de pago
    metodo_pago VARCHAR(30) NOT NULL
        CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE', 'DEPOSITO', 'OTRO'))
        COMMENT 'Método de pago: EFECTIVO, TRANSFERENCIA, TARJETA, CHEQUE, DEPOSITO, OTRO',
    
    numero_referencia VARCHAR(100)
        COMMENT 'Referencia del banco/método (ej: número de cheque, referencia de transferencia)',
    
    comprobante_url TEXT
        COMMENT 'URL del comprobante de pago (recibo, etc.)',
    
    -- Auditoría
    observaciones TEXT
        COMMENT 'Notas sobre el pago',
    
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
        COMMENT 'Timestamp de registro del pago'
);

COMMENT ON TABLE sistema_facturacion.log_pago_facturas IS
'Auditoría de pagos. Una factura puede tener múltiples pagos (cuotas, abonos, etc.)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_log_pago_factura_id 
    ON sistema_facturacion.log_pago_facturas(factura_id)
    COMMENT 'Búsqueda rápida por factura_id';

CREATE INDEX IF NOT EXISTS idx_log_pago_fecha 
    ON sistema_facturacion.log_pago_facturas(fecha_pago)
    COMMENT 'Búsqueda rápida por fecha de pago';

CREATE INDEX IF NOT EXISTS idx_log_pago_usuario 
    ON sistema_facturacion.log_pago_facturas(usuario_id)
    COMMENT 'Búsqueda rápida por usuario responsable';
