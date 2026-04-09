-- =====================================================
-- TABLA: CATEGORIA_GASTO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.categoria_gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresa(id) ON DELETE CASCADE,

    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,

    tipo TEXT NOT NULL CHECK (tipo IN ('fijo', 'variable', 'operativo', 'financiero')),

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_categoria_gasto_empresa_codigo
        UNIQUE (empresa_id, codigo)
);

CREATE INDEX idx_categoria_gasto_empresa ON sistema_facturacion.categoria_gasto(empresa_id);

-- =====================================================
-- TABLA: TIPO_MOVIMIENTO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.tipo_movimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(20) NOT NULL UNIQUE
        CHECK (nombre IN ('COMPRA', 'VENTA', 'DEVOLUCION')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: UNIDAD_MEDIDA
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.unidad_medida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(20) NOT NULL UNIQUE
        CHECK (nombre IN ('UNIDAD', 'CAJA', 'BULTO', 'KILO', 'METRO', 'LITRO')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: GASTO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresa(id) ON DELETE CASCADE,

    proveedor_id UUID
        REFERENCES sistema_facturacion.proveedor(id) ON DELETE SET NULL,

    categoria_gasto_id UUID NOT NULL
        REFERENCES sistema_facturacion.categoria_gasto(id) ON DELETE RESTRICT,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuario(id) ON DELETE RESTRICT,

    numero_factura TEXT,

    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,

    concepto TEXT NOT NULL,

    subtotal NUMERIC(15,2) NOT NULL CHECK (subtotal >= 0),
    iva NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (iva >= 0),
    total NUMERIC(15,2) NOT NULL CHECK (total >= 0),

    estado_pago TEXT NOT NULL
        CHECK (estado_pago IN ('pendiente', 'pagado', 'vencido', 'cancelado', 'reembolsado')),

    comprobante_url TEXT,

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_gastos_empresa ON sistema_facturacion.gastos(empresa_id);
CREATE INDEX idx_gastos_usuario ON sistema_facturacion.gastos(usuario_id);
CREATE INDEX idx_gastos_categoria ON sistema_facturacion.gastos(categoria_gasto_id);
CREATE INDEX idx_gastos_fecha_emision ON sistema_facturacion.gastos(fecha_emision);
CREATE INDEX idx_gastos_estado_pago ON sistema_facturacion.gastos(estado_pago);

-- =====================================================
-- TABLA: PAGO_GASTO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.pago_gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    gasto_id UUID NOT NULL
        REFERENCES sistema_facturacion.gastos(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuario(id) ON DELETE RESTRICT,

    numero_comprobante TEXT,

    fecha_pago DATE NOT NULL,

    monto NUMERIC(15,2) NOT NULL CHECK (monto >= 0),

    metodo_pago TEXT NOT NULL
        CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'cheque')),

    numero_referencia TEXT,

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pago_gasto_gasto ON sistema_facturacion.pago_gasto(gasto_id);
CREATE INDEX idx_pago_gasto_usuario ON sistema_facturacion.pago_gasto(usuario_id);
CREATE INDEX idx_pago_gasto_fecha ON sistema_facturacion.pago_gasto(fecha_pago);

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

-- =====================================================
-- TABLA: REPORTE_GENERADO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.reporte_generado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresa(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuario(id) ON DELETE RESTRICT,

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

CREATE INDEX idx_reporte_empresa ON sistema_facturacion.reporte_generado(empresa_id);
CREATE INDEX idx_reporte_usuario ON sistema_facturacion.reporte_generado(usuario_id);
CREATE INDEX idx_reporte_fecha_generacion ON sistema_facturacion.reporte_generado(fecha_generacion);
