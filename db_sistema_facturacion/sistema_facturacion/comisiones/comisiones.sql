-- =========================================
-- MÓDULO: COMISIONES
-- TABLA: comisiones
-- =========================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.comisiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vendedor_id UUID NOT NULL
        REFERENCES sistema_facturacion.vendedor(id)
        ON DELETE RESTRICT,

    pago_suscripcion_id UUID NOT NULL
        REFERENCES sistema_facturacion.pago_suscripciones(id)
        ON DELETE CASCADE,

    monto NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
    porcentaje_aplicado NUMERIC(5,2) NOT NULL CHECK (porcentaje_aplicado >= 0),

    estado TEXT NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'PAGADA')),

    -- Fechas de negocio
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_aprobacion TIMESTAMPTZ,
    fecha_pago TIMESTAMPTZ,

    metodo_pago TEXT,
    observaciones TEXT,

    -- Aprobación por SUPERADMIN
    aprobado_por UUID
        REFERENCES sistema_facturacion.users(id)
        ON DELETE SET NULL,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Una comisión por pago
    CONSTRAINT uq_comision_pago UNIQUE (pago_suscripcion_id)
);
