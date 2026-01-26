-- =====================================================
-- MÓDULO: SUSCRIPCIONES
-- TABLA: suscripciones_log
-- Descripción:
-- Registro histórico de TODOS los cambios relevantes
-- de una suscripción (estado, plan, periodo, etc.).
-- Solo INSERT. Nunca UPDATE ni DELETE.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.suscripciones_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referencia a la suscripción
    suscripcion_id UUID NOT NULL
        REFERENCES public.suscripciones(id)
        ON DELETE CASCADE,

    -- Estado del servicio (antes / después)
    estado_anterior TEXT,
    estado_nuevo TEXT NOT NULL
        CHECK (estado_nuevo IN ('ACTIVA', 'CANCELADA', 'SUSPENDIDA', 'VENCIDA')),

    -- Plan (antes / después)
    plan_anterior UUID
        REFERENCES public.plan(id)
        ON DELETE SET NULL,

    plan_nuevo UUID
        REFERENCES public.plan(id)
        ON DELETE SET NULL,

    -- Periodo (antes / después)
    fecha_inicio_anterior TIMESTAMPTZ,
    fecha_fin_anterior TIMESTAMPTZ,

    fecha_inicio_nuevo TIMESTAMPTZ,
    fecha_fin_nuevo TIMESTAMPTZ,

    -- Quién / qué originó el cambio
    cambiado_por UUID
        REFERENCES public.usuario(id)
        ON DELETE SET NULL,

    origen TEXT NOT NULL DEFAULT 'SISTEMA'
        CHECK (origen IN ('SISTEMA', 'ADMIN', 'USUARIO')),

    -- Motivo del cambio
    motivo TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historial por suscripción
CREATE INDEX IF NOT EXISTS idx_suscripciones_log_suscripcion
ON public.suscripciones_log (suscripcion_id);

-- Auditoría por fecha
CREATE INDEX IF NOT EXISTS idx_suscripciones_log_created_at
ON public.suscripciones_log (created_at);

-- Auditoría por origen
CREATE INDEX IF NOT EXISTS idx_suscripciones_log_origen
ON public.suscripciones_log (origen);
