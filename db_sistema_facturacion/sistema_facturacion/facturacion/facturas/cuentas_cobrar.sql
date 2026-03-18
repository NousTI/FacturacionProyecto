-- =========================================
-- CUENTA COBRAR
-- ==================================================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.cuentas_cobrar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    factura_id UUID NOT NULL
        REFERENCES sistema_facturacion.facturas(id) ON DELETE CASCADE,

    cliente_id UUID NOT NULL
        REFERENCES sistema_facturacion.clientes(id) ON DELETE RESTRICT,

    numero_documento TEXT NOT NULL,

    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL
        CHECK (fecha_vencimiento >= fecha_emision),

    monto_total NUMERIC(12,2) NOT NULL
        CHECK (monto_total >= 0),

    monto_pagado NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (monto_pagado >= 0),

    saldo_pendiente NUMERIC(12,2) NOT NULL
        CHECK (saldo_pendiente >= 0),

    estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'pagado', 'vencido', 'anulado')),

    dias_vencido INTEGER NOT NULL DEFAULT 0
        CHECK (dias_vencido >= 0),

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_montos_consistencia
    CHECK (
        monto_pagado <= monto_total AND
        saldo_pendiente = monto_total - monto_pagado
    ),

    CONSTRAINT uq_cuenta_cobrar_factura UNIQUE (factura_id)
);