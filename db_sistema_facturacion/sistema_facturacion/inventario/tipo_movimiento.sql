-- =====================================================
-- TABLA: TIPO_MOVIMIENTO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.tipo_movimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(20) NOT NULL UNIQUE
        CHECK (nombre IN ('COMPRA', 'VENTA', 'DEVOLUCION')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
