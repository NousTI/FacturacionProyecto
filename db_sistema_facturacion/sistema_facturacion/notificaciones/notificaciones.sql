-- =========================================
-- MÓDULO: NOTIFICACIONES
-- TABLA: notificaciones
-- Descripción: 
-- Almacena las alertas en tiempo real para 
-- usuarios (empresas, vendedores, superadmins).
-- =========================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Quién recibe la notificación (referencia cruzada a users)
    user_id UUID NOT NULL
        REFERENCES sistema_facturacion.users(id)
        ON DELETE CASCADE,

    -- Título y mensaje de la notificación
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,

    -- Categoría (RENOVACION, PAGO, SISTEMA, etc.)
    tipo TEXT NOT NULL DEFAULT 'RENOVACION'
        CHECK (tipo IN ('RENOVACION', 'PAGO', 'SISTEMA', 'OTRO')),

    -- Prioridad (BAJA, MEDIA, ALTA)
    prioridad TEXT NOT NULL DEFAULT 'MEDIA'
        CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA')),

    -- Datos adicionales (ej. ID de la solicitud para redirigir)
    -- Formato JSONB para mayor flexibilidad
    metadata JSONB,

    -- Estado de la notificación
    leido BOOLEAN NOT NULL DEFAULT FALSE,
    leido_at TIMESTAMPTZ,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para mejorar el rendimiento de carga de notificaciones no leídas por usuario
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_leido ON sistema_facturacion.notificaciones(user_id, leido);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON sistema_facturacion.notificaciones(tipo);
