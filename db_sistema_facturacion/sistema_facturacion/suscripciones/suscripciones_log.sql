-- =====================================================
-- MÓDULO: SUSCRIPCIONES
-- TABLA: suscripciones_log
-- Descripción:
-- Registro histórico de TODOS los cambios relevantes
-- de una suscripción (estado, plan, periodo, etc.).
-- Solo INSERT. Nunca UPDATE ni DELETE.
-- =====================================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.suscripciones_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referencia a la suscripción
    suscripcion_id UUID NOT NULL
        REFERENCES sistema_facturacion.suscripciones(id)
        ON DELETE CASCADE,

    -- Estado del servicio (antes / después)
    estado_anterior TEXT,
    estado_nuevo TEXT NOT NULL
        CHECK (estado_nuevo IN ('ACTIVA', 'CANCELADA', 'SUSPENDIDA', 'VENCIDA')),

    -- Plan (antes / después)
    plan_anterior UUID
        REFERENCES sistema_facturacion.planes(id)
        ON DELETE SET NULL,

    plan_nuevo UUID
        REFERENCES sistema_facturacion.planes(id)
        ON DELETE SET NULL,

    -- Periodo (antes / después)
    fecha_inicio_anterior TIMESTAMPTZ,
    fecha_fin_anterior TIMESTAMPTZ,

    fecha_inicio_nuevo TIMESTAMPTZ,
    fecha_fin_nuevo TIMESTAMPTZ,

    -- Quién / qué originó el cambio    
    cambiado_por UUID
        REFERENCES sistema_facturacion.users(id)
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
ON sistema_facturacion.suscripciones_log (suscripcion_id);

-- Últimos cambios por suscripción (CLAVE)
CREATE INDEX IF NOT EXISTS idx_suscripciones_log_suscripcion_fecha
ON sistema_facturacion.suscripciones_log (suscripcion_id, created_at DESC);

-- Auditoría por fecha
CREATE INDEX IF NOT EXISTS idx_suscripciones_log_created_at
ON sistema_facturacion.suscripciones_log (created_at);

-- Auditoría por origen
CREATE INDEX IF NOT EXISTS idx_suscripciones_log_origen
ON sistema_facturacion.suscripciones_log (origen);

-- Auditoría por estado nuevo
CREATE INDEX IF NOT EXISTS idx_suscripciones_log_estado_nuevo
ON sistema_facturacion.suscripciones_log (estado_nuevo);

-- Auditoría por responsable
CREATE INDEX IF NOT EXISTS idx_suscripciones_log_cambiado_por
ON sistema_facturacion.suscripciones_log (cambiado_por);
