-- =====================================================
-- TABLA: GASTO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    proveedor_id UUID
        REFERENCES sistema_facturacion.proveedores(id) ON DELETE SET NULL,

    categoria_gasto_id UUID NOT NULL
        REFERENCES sistema_facturacion.categoria_gasto(id) ON DELETE RESTRICT,

    user_id UUID NOT NULL
        REFERENCES sistema_facturacion.users(id) ON DELETE RESTRICT,

    numero_factura TEXT,

    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,

    concepto TEXT NOT NULL,

    subtotal NUMERIC(15,2) NOT NULL CHECK (subtotal >= 0),
    iva NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (iva >= 0),
    total NUMERIC(15,2) NOT NULL CHECK (total >= 0),

    estado_pago TEXT NOT NULL
        CHECK (estado_pago IN ('pendiente', 'parcial', 'pagado', 'vencido', 'cancelado', 'reembolsado')),

    comprobante_url TEXT,

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_gastos_empresa ON sistema_facturacion.gastos(empresa_id);
CREATE INDEX idx_gastos_usuario ON sistema_facturacion.gastos(user_id);
CREATE INDEX idx_gastos_categoria ON sistema_facturacion.gastos(categoria_gasto_id);
CREATE INDEX idx_gastos_fecha_emision ON sistema_facturacion.gastos(fecha_emision);
CREATE INDEX idx_gastos_estado_pago ON sistema_facturacion.gastos(estado_pago);