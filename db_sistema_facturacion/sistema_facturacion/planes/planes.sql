-- =========================================
-- MÓDULO: PLANES
-- TABLA: planes
-- Descripción: Planes de suscripción para el SaaS
-- =========================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,

    precio_mensual NUMERIC(10,2) NOT NULL DEFAULT 0.00,

    max_usuarios INT NOT NULL,
    max_facturas_mes INT NOT NULL,
    max_establecimientos INT NOT NULL,
    max_programaciones INT NOT NULL,

    caracteristicas JSONB,

    visible_publico BOOLEAN NOT NULL DEFAULT TRUE,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    orden INT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);