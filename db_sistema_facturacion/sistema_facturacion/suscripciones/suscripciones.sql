-- =====================================================
-- MÓDULO: SUSCRIPCIONES
-- TABLA: suscripciones
-- Descripción:
-- Controla el estado del SERVICIO (acceso al SaaS),
-- independiente de los pagos.
-- =====================================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.suscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- A quién pertenece la suscripción
    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id)
        ON DELETE CASCADE,

    -- Plan activo (puede cambiar con renovaciones)
    plan_id UUID NOT NULL
        REFERENCES sistema_facturacion.planes(id)
        ON DELETE RESTRICT,

    -- Periodo del servicio
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,

    -- Estado del SERVICIO (no del pago)
    estado TEXT NOT NULL DEFAULT 'ACTIVA'
        CHECK (estado IN ('ACTIVA', 'CANCELADA', 'SUSPENDIDA', 'VENCIDA')),

    -- Quién cambió el estado (admin / sistema)
    actualizado_por UUID
        REFERENCES sistema_facturacion.users(id)
        ON DELETE SET NULL,

    -- Motivo del estado (opcional pero muy útil)
    observaciones TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Una sola suscripción activa por empresa
    UNIQUE (empresa_id)
);

ACTIVA → Pagó y está dentro del periodo
CANCELADA → El usuario decide no renovar
SUSPENDIDA → Incumplimiento / fraude / bloqueo manual
VENCIDA → No renovó y el periodo terminó
