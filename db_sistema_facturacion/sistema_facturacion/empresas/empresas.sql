-- =========================================
-- MÓDULO: EMPRESAS
-- TABLA: empresa
-- Descripción:
-- Información legal y tributaria de la empresa
-- =========================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relación con el vendedor
    vendedor_id UUID
        REFERENCES sistema_facturacion.vendedores(id)
        ON DELETE SET NULL,

    -- Identificación SRI
    ruc TEXT NOT NULL UNIQUE CHECK (ruc ~ '^[0-9]{10}001$'), -- 13 dígitos, termina en 001
    razon_social TEXT NOT NULL,
    nombre_comercial TEXT,

    -- Contacto y ubicación
    email TEXT NOT NULL,
    telefono TEXT,
    direccion TEXT NOT NULL,
    logo_url TEXT,

    -- Estado administrativo (no SaaS)
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    tipo_persona TEXT NOT NULL
        CHECK (tipo_persona IN ('NATURAL', 'JURIDICA')),
    -- Información tributaria obligatoria
    tipo_contribuyente TEXT NOT NULL
        CHECK (tipo_contribuyente IN ('REGIMEN_GENERAL', 'RIMPE_EMPRENDEDOR', 'RIMPE_POPULAR')),

    obligado_contabilidad BOOLEAN NOT NULL DEFAULT FALSE,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
