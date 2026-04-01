-- =========================================
-- MÓDULO: RENOVACIONES
-- TABLA: solicitudes_renovacion
-- Descripción: 
-- Gestiona las peticiones de renovación de suscripción
-- iniciadas por las empresas, notificando a vendedores
-- y requiriendo aprobación de superadmin.
-- =========================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.solicitudes_renovacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Empresa que solicita la renovación
    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id)
        ON DELETE CASCADE,

    -- Suscripción actual que se desea renovar
    suscripcion_id UUID NOT NULL
        REFERENCES sistema_facturacion.suscripciones(i)
        ON DELETE CASCADE,

    -- Plan al que desea renovar (puede ser el mismo o un upgrade)
    plan_id UUID NOT NULL
        REFERENCES sistema_facturacion.planes(id)
        ON DELETE RESTRICT,

    -- Vendedor asignado al momento de la solicitud (para reportes y acceso)
    vendedor_id UUID
        REFERENCES sistema_facturacion.vendedores(id)
        ON DELETE SET NULL,

    -- Estado de la gestión
    estado TEXT NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA')),

    -- URL del comprobante de pago si el usuario lo sube
    comprobante_url TEXT,

    -- Quién aprobó o rechazó (Superadmin)
    procesado_por UUID
        REFERENCES sistema_facturacion.users(id)
        ON DELETE SET NULL,

    -- Feedback en caso de rechazo
    motivo_rechazo TEXT,

    -- Auditoría
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_procesamiento TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para mejorar la velocidad de consulta en paneles de gestión
CREATE INDEX IF NOT EXISTS idx_solicitudes_renovacion_estado ON sistema_facturacion.solicitudes_renovacion(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_renovacion_empresa ON sistema_facturacion.solicitudes_renovacion(empresa_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_renovacion_vendedor ON sistema_facturacion.solicitudes_renovacion(vendedor_id);
