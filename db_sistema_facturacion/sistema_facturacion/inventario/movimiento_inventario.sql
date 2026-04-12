-- =====================================================
-- TABLA ÚNICA: MOVIMIENTOS_INVENTARIO (KARDEX)
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.inventario_movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES sistema_facturacion.productos(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,

    -- Tipos alineados al Formulario 104 [cite: 31, 206]
    tipo_movimiento VARCHAR(20) NOT NULL 
        CHECK (tipo_movimiento IN ('COMPRA', 'VENTA', 'DEVOLUCION_CLIENTE', 'DEVOLUCION_PROVEEDOR', 'AJUSTE', 'INICIAL')),

    -- Cantidad con decimales para pesaje (Kilos/Metros) [cite: 315]
    cantidad NUMERIC(12,3) NOT NULL CHECK (cantidad > 0),
    
    -- Fotos del stock para auditoría (Kardex)
    stock_anterior NUMERIC(12,3) NOT NULL,
    stock_nuevo NUMERIC(12,3) NOT NULL,

    -- Valores monetarios (Crucial para Casilleros 401 y 500 del Form 104) [cite: 34, 207]
    valor_unitario NUMERIC(12,4) NOT NULL, -- Precio de venta o costo de compra
    valor_total NUMERIC(12,4) NOT NULL,

    -- Relación Legal SRI [cite: 124, 689]
    -- Esto te permite saber qué factura o Nota de Crédito generó el movimiento
    documento_id UUID, 
    tipo_documento TEXT CHECK (tipo_documento IN ('FACTURA', 'NOTA_CREDITO', 'LIQUIDACION_COMPRA')),
    referencia_texto VARCHAR(50), -- Por si es una factura externa de proveedor

    observaciones TEXT,
    fecha_movimiento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices esenciales para reportes rápidos
CREATE INDEX idx_inv_mov_empresa_producto ON sistema_facturacion.inventario_movimientos(empresa_id, producto_id);
CREATE INDEX idx_inv_mov_fecha ON sistema_facturacion.inventario_movimientos(fecha_movimiento);