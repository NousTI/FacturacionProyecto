
-- =========================================
-- FACTURACION PROGRAMADA 
-- ==================================================================================
CREATE TABLE IF NOT EXISTS public.facturacion_programada (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES public.empresa(id) ON DELETE CASCADE,

    cliente_id UUID NOT NULL
        REFERENCES public.cliente(id) ON DELETE RESTRICT,

    usuario_id UUID NOT NULL
        REFERENCES public.usuario(id) ON DELETE RESTRICT,

    tipo_frecuencia TEXT NOT NULL
        CHECK (tipo_frecuencia IN ('MENSUAL', 'TRIMESTRAL', 'ANUAL')),

    dia_emision INT
        CHECK (dia_emision BETWEEN 1 AND 31),

    monto NUMERIC(12,2) NOT NULL
        CHECK (monto >= 0),

    concepto TEXT NOT NULL,

    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,

    ultima_emision DATE,
    proxima_emision DATE,

    total_emisiones INT NOT NULL DEFAULT 0,
    emisiones_exitosas INT NOT NULL DEFAULT 0,
    emisiones_fallidas INT NOT NULL DEFAULT 0,

    activo BOOLEAN NOT NULL DEFAULT TRUE,
    enviar_email BOOLEAN NOT NULL DEFAULT TRUE,

    configuracion JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);
