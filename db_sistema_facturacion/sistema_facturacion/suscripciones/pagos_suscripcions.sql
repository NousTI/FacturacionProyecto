
-- ==================================================================================
-- PAGO_SUSCRIPCION
-- =========================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.pagos_suscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    plan_id UUID NOT NULL REFERENCES sistema_facturacion.planes(id) ON DELETE RESTRICT,

    monto NUMERIC(10,2) NOT NULL CHECK (monto >= 0),

    -- Fechas de negocio (todas con zona horaria)
    fecha_pago TIMESTAMPTZ NOT NULL,
    fecha_inicio_periodo TIMESTAMPTZ NOT NULL,
    fecha_fin_periodo TIMESTAMPTZ NOT NULL,

    metodo_pago TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE'
    CHECK (estado IN ('PENDIENTE', 'PAGADO', 'ANULADO', 'REEMBOLSADO'));

    numero_comprobante TEXT,
    comprobante_url TEXT,
    observaciones TEXT,

    registrado_por UUID REFERENCES sistema_facturacion.usuarios(id) ON DELETE SET NULL,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


PENDIENTE -> Aún se verifica que se haya pagado
PAGADO -> Ya se confirmó el pago
ANULADO -> Por incumplimiento de normas
REEMBOLSADO -> Por solicitud del cliente
