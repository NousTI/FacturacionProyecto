-- =========================================
-- TABLA: proveedor
-- =========================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT null REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    identificacion TEXT NOT NULL,
    tipo_identificacion TEXT NOT NULL, -- RUC | CEDULA | PASAPORTE

    razon_social TEXT NOT NULL,
    nombre_comercial TEXT,

    email TEXT,
    telefono TEXT,
    direccion TEXT,
    ciudad TEXT,
    provincia TEXT,

    dias_credito INT NOT NULL DEFAULT 0,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Un proveedor no se repite dentro de la misma empresa
    CONSTRAINT uq_proveedor_empresa_identificacion UNIQUE (empresa_id, identificacion)
);
