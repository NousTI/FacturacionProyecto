
-- =====================================================
-- TABLA: PAGO_FACTURA
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.pagos_factura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cuenta_cobrar_id UUID NOT NULL
        REFERENCES sistema_facturacion.cuentas_cobrar(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,

    numero_recibo TEXT NOT NULL UNIQUE,

    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,

    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),

    -- 01   Efectivo            No
    -- 16	Tarjeta de Débito	No
    -- 17	Dinero Electrónico	No
    -- 18	Tarjeta Prepago	No
    -- 19	Tarjeta de Crédito	SÍ
    -- 20	Transferencia / Cheque	No
    -- 21	Endoso de Títulos	SÍ
    metodo_pago_sri CHAR(2) NOT NULL
        CHECK (metodo_pago_sri IN ('01','15','16','17','18','19','20','21')),

    numero_referencia TEXT,
    comprobante_url TEXT,

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);