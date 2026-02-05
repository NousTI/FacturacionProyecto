
-- =========================================
-- TABLA: productos
-- =========================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,

    precio NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
    costo NUMERIC(12,2) NOT NULL CHECK (costo >= 0),

    stock_actual NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),

    -- Código SRI (Tabla 17): 0=0%, 2=12%, 3=14%, 4=15%, 5=5%, 6=No Objeto, 7=Exento, 8=8%, 10=13%
    tipo_iva TEXT NOT NULL CHECK (tipo_iva IN ('0', '2', '3', '4', '5', '6', '7', '8', '10')),
    porcentaje_iva NUMERIC(5,2) NOT NULL CHECK (porcentaje_iva >= 0),

    maneja_inventario BOOLEAN NOT NULL DEFAULT TRUE,

    tipo TEXT, -- BIEN o SERVICIO
    unidad_medida TEXT,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Un código de producto no se repite dentro de la misma empresa
    CONSTRAINT uq_productos_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- Índice para optimizar búsquedas por empresa
CREATE INDEX IF NOT EXISTS idx_productos_empresa_id ON sistema_facturacion.productos(empresa_id);
