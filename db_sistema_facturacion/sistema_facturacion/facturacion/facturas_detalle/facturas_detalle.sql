
-- =========================================
-- FACTURA DETALLE
-- ==================================================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.facturas_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factura_id UUID NOT NULL
        REFERENCES sistema_facturacion.facturas(id) ON DELETE CASCADE,

    producto_id UUID
        REFERENCES sistema_facturacion.productos(id) ON DELETE SET NULL,

    codigo_producto TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,

    cantidad INT NOT NULL
        CHECK (cantidad > 0),

    precio_unitario NUMERIC(12,2) NOT NULL
        CHECK (precio_unitario >= 0),

    descuento NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (descuento >= 0),

    subtotal NUMERIC(12,2) NOT NULL
        CHECK (subtotal >= 0),

    tipo_iva TEXT NOT NULL,
    valor_iva NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (valor_iva >= 0),

    -- -- NUEVOS CAMPOS SRI
    -- codigo_impuesto VARCHAR(1) NOT NULL DEFAULT '2',
    -- tarifa_iva NUMERIC(5,2) NOT NULL DEFAULT 0,
    -- base_imponible NUMERIC(12,2) NOT NULL DEFAULT 0,

    costo_unitario NUMERIC(12,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
