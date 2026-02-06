
-- =========================================
-- FACTURA DETALLE
-- ==================================================================================
CREATE TABLE IF NOT EXISTS public.factura_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factura_id UUID NOT NULL
        REFERENCES public.factura(id) ON DELETE CASCADE,

    producto_id UUID
        REFERENCES public.producto(id) ON DELETE SET NULL,

    codigo_producto TEXT NOT NULL,
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

    costo_unitario NUMERIC(12,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
