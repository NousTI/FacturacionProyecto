-- =====================================================
-- TABLA: REPORTE_GENERADO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.reporte_generado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,

    tipo_reporte TEXT NOT NULL,
    nombre TEXT NOT NULL,

    parametros JSONB,

    formato TEXT NOT NULL, -- pdf, xlsx, csv, etc.
    archivo_url TEXT,

    tamanio_bytes INTEGER CHECK (tamanio_bytes >= 0),

    estado TEXT NOT NULL DEFAULT 'GENERADO',

    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_expiracion TIMESTAMPTZ,

    descargas INTEGER NOT NULL DEFAULT 0 CHECK (descargas >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



-- =====================================================
-- MÓDULO: MODULO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.modulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,

    icono TEXT,
    categoria TEXT,

    orden INTEGER NOT NULL DEFAULT 0 CHECK (orden >= 0),

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_modulo_codigo UNIQUE (codigo)
);



-- =====================================================
-- MÓDULO: MODULO_PLAN
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.modulos_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    plan_id UUID NOT NULL
        REFERENCES sistema_facturacion.planes(id) ON DELETE CASCADE,

    modulo_id UUID NOT NULL
        REFERENCES sistema_facturacion.modulos(id) ON DELETE CASCADE,

    incluido BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_modulo_plan
        UNIQUE (plan_id, modulo_id)
);



-- =====================================================
-- MÓDULO: MODULO_EMPRESA
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.modulo_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    modulo_id UUID NOT NULL
        REFERENCES sistema_facturacion.modulos(id) ON DELETE CASCADE,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    fecha_activacion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_modulo_empresa
        UNIQUE (empresa_id, modulo_id)
);





-- =====================================================
-- TABLA: CATEGORIA_GASTO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.categoria_gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,

    tipo TEXT NOT NULL,                -- fijo | variable | operativo | financiero

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_categoria_gasto_empresa_codigo
        UNIQUE (empresa_id, codigo)
);

-- =====================================================
-- TABLA: GASTO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    proveedor_id UUID
        REFERENCES sistema_facturacion.proveedores(id) ON DELETE SET NULL,

    categoria_gasto_id UUID NOT NULL
        REFERENCES sistema_facturacion.categoria_gasto(id) ON DELETE RESTRICT,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,

    numero_factura TEXT,

    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,

    concepto TEXT NOT NULL,

    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    iva NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (iva >= 0),
    total NUMERIC(12,2) NOT NULL CHECK (total >= 0),

    estado_pago TEXT NOT NULL DEFAULT 'pendiente', -- pendiente | pagado | vencido

    comprobante_url TEXT,

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =====================================================
-- TABLA: PAGO_GASTO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.pago_gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    gasto_id UUID NOT NULL
        REFERENCES sistema_facturacion.gasto(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,

    numero_comprobante TEXT,

    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,

    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),

    metodo_pago TEXT NOT NULL,          -- efectivo, transferencia, tarjeta, cheque
    numero_referencia TEXT,

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =====================================================
-- TABLA: MOVIMIENTO_INVENTARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.movimiento_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    producto_id UUID NOT NULL
        REFERENCES sistema_facturacion.productos(id) ON DELETE RESTRICT,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,

    factura_id UUID
        REFERENCES sistema_facturacion.facturas(id) ON DELETE SET NULL,

    tipo_movimiento TEXT NOT NULL,      -- entrada | salida | ajuste | devolucion

    cantidad INTEGER NOT NULL CHECK (cantidad > 0),

    costo_unitario NUMERIC(12,2) CHECK (costo_unitario >= 0),
    costo_total NUMERIC(12,2) CHECK (costo_total >= 0),

    stock_anterior INTEGER NOT NULL CHECK (stock_anterior >= 0),
    stock_nuevo INTEGER NOT NULL CHECK (stock_nuevo >= 0),

    documento_referencia TEXT,
    observaciones TEXT,

    fecha_movimiento TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
