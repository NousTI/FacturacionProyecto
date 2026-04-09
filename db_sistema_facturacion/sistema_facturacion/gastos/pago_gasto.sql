-- =====================================================
-- TABLA: PAGO_GASTO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.pago_gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    gasto_id UUID NOT NULL
        REFERENCES sistema_facturacion.gastos(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,

    numero_comprobante TEXT,

    fecha_pago DATE NOT NULL,

    monto NUMERIC(15,2) NOT NULL CHECK (monto >= 0),

    metodo_pago TEXT NOT NULL
        CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'cheque')),

    numero_referencia TEXT,

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pago_gasto_gasto ON sistema_facturacion.pago_gasto(gasto_id);
CREATE INDEX idx_pago_gasto_usuario ON sistema_facturacion.pago_gasto(usuario_id);
CREATE INDEX idx_pago_gasto_fecha ON sistema_facturacion.pago_gasto(fecha_pago);

