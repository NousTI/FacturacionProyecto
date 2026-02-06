

-- =====================================================
-- TABLA: FORMA_PAGO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.forma_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factura_id UUID NOT NULL
        REFERENCES public.factura(id) ON DELETE CASCADE,

    forma_pago TEXT NOT NULL,          -- ej: efectivo, tarjeta, transferencia
    valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),

    plazo INTEGER CHECK (plazo >= 0),
    unidad_tiempo TEXT,                -- dias, meses

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================-- =========================================-- =========================================-- =========================================



-- =========================================
-- TABLA: proveedor
-- =========================================
CREATE TABLE IF NOT EXISTS public.proveedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT null REFERENCES public.empresa(id) ON DELETE CASCADE,

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



-- =========================================
-- CUENTA COBRAR
-- ==================================================================================
CREATE TABLE IF NOT EXISTS public.cuenta_cobrar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES public.empresa(id) ON DELETE CASCADE,

    factura_id UUID NOT NULL
        REFERENCES public.factura(id) ON DELETE CASCADE,

    cliente_id UUID NOT NULL
        REFERENCES public.cliente(id) ON DELETE RESTRICT,

    numero_documento TEXT NOT NULL,

    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,

    monto_total NUMERIC(12,2) NOT NULL CHECK (monto_total >= 0),
    monto_pagado NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monto_pagado >= 0),
    saldo_pendiente NUMERIC(12,2) NOT NULL CHECK (saldo_pendiente >= 0),

    estado TEXT NOT NULL DEFAULT 'pendiente',
    dias_vencido INTEGER NOT NULL DEFAULT 0,

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =====================================================
-- TABLA: PAGO_FACTURA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pago_factura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cuenta_cobrar_id UUID NOT NULL
        REFERENCES public.cuenta_cobrar(id) ON DELETE CASCADE,

    factura_id UUID NOT NULL
        REFERENCES public.factura(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES public.usuario(id) ON DELETE RESTRICT,

    numero_recibo TEXT NOT NULL,

    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,

    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),

    metodo_pago TEXT NOT NULL,
    numero_referencia TEXT,
    comprobante_url TEXT,

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



-- =====================================================
-- TABLA: REPORTE_GENERADO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reporte_generado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL REFERENCES public.empresa(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL REFERENCES public.usuario(id) ON DELETE RESTRICT,

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
CREATE TABLE IF NOT EXISTS public.modulo (
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
CREATE TABLE IF NOT EXISTS public.modulo_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    plan_id UUID NOT NULL
        REFERENCES public.plan(id) ON DELETE CASCADE,

    modulo_id UUID NOT NULL
        REFERENCES public.modulo(id) ON DELETE CASCADE,

    incluido BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_modulo_plan
        UNIQUE (plan_id, modulo_id)
);



-- =====================================================
-- MÓDULO: MODULO_EMPRESA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.modulo_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES public.empresa(id) ON DELETE CASCADE,

    modulo_id UUID NOT NULL
        REFERENCES public.modulo(id) ON DELETE CASCADE,

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
CREATE TABLE IF NOT EXISTS public.categoria_gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES public.empresa(id) ON DELETE CASCADE,

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
CREATE TABLE IF NOT EXISTS public.gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES public.empresa(id) ON DELETE CASCADE,

    proveedor_id UUID
        REFERENCES public.proveedor(id) ON DELETE SET NULL,

    categoria_gasto_id UUID NOT NULL
        REFERENCES public.categoria_gasto(id) ON DELETE RESTRICT,

    usuario_id UUID NOT NULL
        REFERENCES public.usuario(id) ON DELETE RESTRICT,

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
CREATE TABLE IF NOT EXISTS public.pago_gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    gasto_id UUID NOT NULL
        REFERENCES public.gasto(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES public.usuario(id) ON DELETE RESTRICT,

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
CREATE TABLE IF NOT EXISTS public.movimiento_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES public.empresa(id) ON DELETE CASCADE,

    producto_id UUID NOT NULL
        REFERENCES public.producto(id) ON DELETE RESTRICT,

    usuario_id UUID NOT NULL
        REFERENCES public.usuario(id) ON DELETE RESTRICT,

    factura_id UUID
        REFERENCES public.factura(id) ON DELETE SET NULL,

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
