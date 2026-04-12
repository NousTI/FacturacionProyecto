-- =====================================================
-- TABLA: INVENTARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    producto_id UUID NOT NULL REFERENCES sistema_facturacion.productos(id) ON DELETE RESTRICT,

    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('COMPRA', 'VENTA', 'DEVOLUCION')),

    unidad_medida VARCHAR(20) NOT NULL CHECK (unidad_medida IN ('UNIDAD', 'CAJA', 'BULTO', 'KILO', 'METRO', 'LITRO')),

    cantidad NUMERIC(12,3) NOT NULL CHECK (cantidad >= 0),

    -- Crucial para el Formulario 104: Valor del producto en ese momento
    valor_unitario NUMERIC(12,4) NOT NULL,

    -- Relación legal: Para rastrear qué factura o nota de crédito originó esto [cite: 124, 243]
    documento_id UUID, 
    tipo_documento TEXT CHECK (tipo_documento IN ('FACTURA', 'NOTA_CREDITO', 'LIQUIDACION_COMPRA')),

    fecha DATE NOT NULL DEFAULT CURRENT_DATE,

    estado VARCHAR(15) NOT NULL CHECK (estado IN ('DISPONIBLE', 'RESERVADO', 'DAÑADO', 'EN_TRANSITO')),

    ubicacion_fisica VARCHAR(50),

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventario_empresa ON sistema_facturacion.inventario(empresa_id);
CREATE INDEX idx_inventario_producto ON sistema_facturacion.inventario(producto_id);
CREATE INDEX idx_inventario_estado ON sistema_facturacion.inventario(estado);
CREATE INDEX idx_inventario_fecha ON sistema_facturacion.inventario(fecha);
