-- =====================================================
-- TABLA: MOVIMIENTO_INVENTARIO (KARDEX)
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.movimiento_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    producto_id UUID NOT NULL
        REFERENCES sistema_facturacion.productos(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,

    tipo_movimiento VARCHAR(20) NOT NULL
        CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste', 'devolucion')),

    cantidad NUMERIC(12,3) NOT NULL CHECK (cantidad > 0),
    
    stock_anterior NUMERIC(12,3) NOT NULL,
    stock_nuevo NUMERIC(12,3) NOT NULL,

    costo_unitario NUMERIC(12,2),
    costo_total NUMERIC(12,2),

    documento_referencia VARCHAR(50),
    
    factura_id UUID, -- Opcional, si viene de una factura

    observaciones TEXT,

    fecha_movimiento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX idx_movimiento_inv_empresa ON sistema_facturacion.movimiento_inventario(empresa_id);
CREATE INDEX idx_movimiento_inv_producto ON sistema_facturacion.movimiento_inventario(producto_id);
CREATE INDEX idx_movimiento_inv_fecha ON sistema_facturacion.movimiento_inventario(fecha_movimiento);
