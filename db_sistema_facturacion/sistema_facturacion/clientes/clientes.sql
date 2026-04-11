-- =========================================
-- MÓDULO: CLIENTES
-- TABLA: clientes
-- Descripción:
-- Clientes asociados a una empresa para facturación
-- =========================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relación con la empresa
    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id)
        ON DELETE CASCADE,

    identificacion TEXT NOT NULL,
    -- 04: RUC, 05: Cédula, 06: Pasaporte, 07: Consumidor Final, 08: Identificación del Exterior
    tipo_identificacion TEXT NOT NULL
        CHECK (tipo_identificacion IN ('04', '05', '06', '07', '08')),

    razon_social TEXT NOT NULL,
    nombre_comercial TEXT,

    email TEXT,
    telefono TEXT,

    direccion TEXT,
    ciudad TEXT,
    provincia TEXT,

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
