
-- =========================================
-- COMISION
-- =========================================
CREATE TABLE IF NOT EXISTS public.comision (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vendedor_id UUID NOT null REFERENCES public.vendedor(id) ON DELETE RESTRICT,

    pago_suscripcion_id UUID NOT null REFERENCES public.pago_suscripcion(id) ON DELETE CASCADE,

    monto NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
    porcentaje_aplicado NUMERIC(5,2) NOT NULL CHECK (porcentaje_aplicado >= 0),

    estado TEXT NOT NULL DEFAULT 'PENDIENTE',

    -- Fechas de negocio (todas con zona horaria)
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_aprobacion TIMESTAMPTZ,
    fecha_pago TIMESTAMPTZ,

    metodo_pago TEXT,
    observaciones TEXT,

    -- Aprobación por SUPERADMIN
    aprobado_por UUID REFERENCES public.superadmin(id) ON DELETE SET NULL,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Una comisión por pago
    CONSTRAINT uq_comision_pago UNIQUE (pago_suscripcion_id)
);