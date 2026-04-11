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
    identificacion TEXT NOT NULL,
    -- 04: RUC, 05: Cédula, 06: Pasaporte, 07: Consumidor Final, 08: Identificación del Exterior
    tipo_identificacion TEXT NOT NULL DEFAULT '05'
        CHECK (tipo_identificacion IN ('04', '05', '06', '07', '08')),

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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Un vendedor se identifica de forma única por su documento (RUC/Cédula)
    CONSTRAINT uq_vendedor_identificacion UNIQUE (identificacion)
);
