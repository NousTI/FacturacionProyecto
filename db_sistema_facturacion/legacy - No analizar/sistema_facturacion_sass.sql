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

-- =====================================================
-- TABLA: MOVIMIENTO_INVENTARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.movimiento_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    producto_id UUID NOT NULL REFERENCES sistema_facturacion.productos(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,

    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste', 'devolucion')),

    cantidad NUMERIC(12,3) NOT NULL CHECK (cantidad > 0),
    
    stock_anterior NUMERIC(12,3) NOT NULL,
    stock_nuevo NUMERIC(12,3) NOT NULL,

    costo_unitario NUMERIC(12,2),
    costo_total NUMERIC(12,2),

    documento_referencia VARCHAR(50),
    
    factura_id UUID, -- Opcional, si viene de una factura

    observaciones TEXT,

    fecha_movimiento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: REPORTE_GENERADO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.reporte_generado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,

    tipo_reporte TEXT NOT NULL,

    nombre TEXT NOT NULL,

    parametros JSONB,

    formato VARCHAR(20),

    archivo_url TEXT,

    tamanio_bytes BIGINT,

    estado VARCHAR(50),

    fecha_generacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    fecha_expiracion TIMESTAMPTZ,

    descargas INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);