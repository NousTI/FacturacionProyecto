-- =====================================================
-- TABLA: FORMAS_PAGO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.formas_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factura_id UUID NOT NULL
        REFERENCES sistema_facturacion.facturas(id) ON DELETE CASCADE,

    valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),

    plazo INTEGER CHECK (plazo >= 0),

    unidad_tiempo VARCHAR(20)
        CHECK (unidad_tiempo IN ('DIAS', 'MESES', 'ANIOS')),

    forma_pago_sri CHAR(2) NOT NULL DEFAULT '01'
        CHECK (forma_pago_sri IN (
            '01', -- SIN UTILIZACIÓN DEL SISTEMA FINANCIERO (EFECTIVO)
            '15', -- COMPENSACIÓN DE DEUDAS
            '16', -- TARJETA DE DÉBITO
            '17', -- DINERO ELECTRONICO
            '18', -- TARJETA PREPAGO
            '19', -- TARJETA DE CRÉDITO
            '20', -- OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO
            '21'  -- ENDOSO DE TÍTULOS
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);