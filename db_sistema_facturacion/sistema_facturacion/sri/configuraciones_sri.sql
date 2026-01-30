
-- =====================================================
-- TABLA: CONFIGURACION_SRI
-- Almacena configuración SRI por empresa
-- El certificado .p12 se guarda CIFRADO en la DB
-- =====================================================

CREATE TABLE sistema_facturacion.configuraciones_sri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    ambiente TEXT NOT NULL
        CHECK (ambiente IN ('PRUEBAS', 'PRODUCCION')),

    tipo_emision TEXT NOT NULL
        CHECK (tipo_emision IN ('NORMAL', 'CONTINGENCIA')),

    certificado_digital BYTEA NOT NULL,
    clave_certificado BYTEA NOT NULL,

    fecha_expiracion_cert TIMESTAMPTZ NOT NULL,

    estado TEXT NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO', 'EXPIRADO', 'REVOCADO')),

    cert_serial TEXT,
    cert_emisor TEXT,
    cert_sujeto TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_configuracion_sri_empresa UNIQUE (empresa_id)
);
