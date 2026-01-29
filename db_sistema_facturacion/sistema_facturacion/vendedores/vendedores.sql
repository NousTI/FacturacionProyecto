-- =========================================
-- MÓDULO: VENDEDOR
-- =========================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.vendedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- FK al sistema de autenticación
    user_id UUID NOT NULL UNIQUE
        REFERENCES sistema_facturacion.users(id)
        ON DELETE CASCADE,

    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,

    telefono TEXT,
    documento_identidad TEXT,

    porcentaje_comision NUMERIC(5,2),
    porcentaje_comision_inicial NUMERIC(5,2),
    porcentaje_comision_recurrente NUMERIC(5,2),

    tipo_comision TEXT
        CHECK (tipo_comision IN ('FIJA', 'PORCENTAJE')),

    puede_crear_empresas BOOLEAN NOT NULL DEFAULT FALSE,
    puede_gestionar_planes BOOLEAN NOT NULL DEFAULT FALSE,
    puede_acceder_empresas BOOLEAN NOT NULL DEFAULT FALSE,
    puede_ver_reportes BOOLEAN NOT NULL DEFAULT FALSE,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    configuracion JSONB,

    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
