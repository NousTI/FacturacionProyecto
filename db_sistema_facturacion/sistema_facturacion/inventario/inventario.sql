-- =====================================================
-- TABLA: INVENTARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresa(id) ON DELETE CASCADE,

    producto_id UUID NOT NULL
        REFERENCES sistema_facturacion.productos(id) ON DELETE RESTRICT,

    tipo_movimiento_id UUID NOT NULL
        REFERENCES sistema_facturacion.tipo_movimiento(id) ON DELETE RESTRICT,

    unidad_medida_id UUID NOT NULL
        REFERENCES sistema_facturacion.unidad_medida(id) ON DELETE RESTRICT,

    cantidad INT NOT NULL CHECK (cantidad >= 0),

    fecha DATE NOT NULL DEFAULT CURRENT_DATE,

    estado VARCHAR(15) NOT NULL
        CHECK (estado IN ('DISPONIBLE', 'RESERVADO', 'DAÑADO', 'EN_TRANSITO')),

    ubicacion_fisica VARCHAR(50),

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventario_empresa ON sistema_facturacion.inventario(empresa_id);
CREATE INDEX idx_inventario_producto ON sistema_facturacion.inventario(producto_id);
CREATE INDEX idx_inventario_estado ON sistema_facturacion.inventario(estado);
CREATE INDEX idx_inventario_fecha ON sistema_facturacion.inventario(fecha);
