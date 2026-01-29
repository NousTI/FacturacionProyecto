-- =========================================
-- MÓDULO: CLIENTES
-- TABLA: clientes
-- Descripción:
-- Clientes asociados a una empresa para facturación
-- =========================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id)
        ON DELETE CASCADE,

    identificacion TEXT NOT NULL,
    tipo_identificacion TEXT NOT NULL
        CHECK (tipo_identificacion IN ('CEDULA', 'RUC', 'PASAPORTE')),

    razon_social TEXT NOT NULL,
    nombre_comercial TEXT,

    email TEXT,
    telefono TEXT,

    direccion TEXT,
    ciudad TEXT,
    provincia TEXT,
    pais TEXT DEFAULT 'Ecuador',

    -- Crédito
    dias_credito INT NOT NULL DEFAULT 0,
    limite_credito NUMERIC(12,2) NOT NULL DEFAULT 0,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Un cliente no se repite dentro de la misma empresa
    CONSTRAINT uq_cliente_empresa_identificacion
        UNIQUE (empresa_id, identificacion)
);
