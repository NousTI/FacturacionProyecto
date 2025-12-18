-- =========================================
-- EXTENSIÓN PARA UUID
-- =========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- SUPERADMIN
-- =========================================
CREATE TABLE IF NOT EXISTS superadmin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,

    activo BOOLEAN NOT NULL DEFAULT TRUE
);
-- =========================================
-- VENDEDOR
-- =========================================
CREATE TABLE IF NOT EXISTS public.vendedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,

    telefono TEXT,
    documento_identidad TEXT,

    porcentaje_comision NUMERIC(5,2),
    tipo_comision TEXT,

    puede_crear_empresas BOOLEAN NOT NULL DEFAULT FALSE,
    puede_gestionar_planes BOOLEAN NOT NULL DEFAULT FALSE,
    puede_ver_reportes BOOLEAN NOT NULL DEFAULT FALSE,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,

    configuracion JSONB
);

-- =========================================
-- PLAN
-- =========================================
CREATE TABLE IF NOT EXISTS public.plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,

    precio_mensual NUMERIC(10,2) NOT NULL DEFAULT 0.00,

    max_usuarios INT NOT NULL,
    max_facturas_mes INT NOT NULL,
    max_establecimientos INT NOT NULL,

    facturacion_programada BOOLEAN NOT NULL DEFAULT FALSE,

    caracteristicas JSONB,

    visible_publico BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- EMPRESA
-- =========================================
CREATE TABLE IF NOT EXISTS public.empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vendedor_id UUID REFERENCES public.vendedor(id) ON DELETE SET NULL,

    ruc TEXT NOT NULL UNIQUE,
    razon_social TEXT NOT NULL,
    nombre_comercial TEXT,

    email TEXT,
    telefono TEXT,
    direccion TEXT,
    logo_url TEXT,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_activacion DATE,
    fecha_vencimiento DATE,

    estado_suscripcion TEXT NOT NULL DEFAULT 'pendiente',
    tipo_contribuyente TEXT,
    obligado_contabilidad BOOLEAN NOT NULL DEFAULT FALSE,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- ROL
-- =========================================
CREATE TABLE IF NOT EXISTS public.rol (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,

    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,

    es_sistema BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Un rol no se repite dentro de la misma empresa
    CONSTRAINT uq_rol_empresa_codigo UNIQUE (empresa_id, codigo)
);


-- =========================================
-- PERMISO
-- =========================================
CREATE TABLE IF NOT EXISTS public.permiso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    modulo TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT NOT NULL
);

-- =========================================
-- ROL_PERMISO
-- =========================================
CREATE TABLE IF NOT EXISTS public.rol_permiso (
    rol_id UUID NOT null REFERENCES public.rol(id) ON DELETE CASCADE,

    permiso_id UUID NOT null REFERENCES public.permiso(id) ON DELETE CASCADE,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    -- Clave primaria compuesta
    PRIMARY KEY (rol_id, permiso_id)
);


-- =========================================
-- USUARIO
-- =========================================
CREATE TABLE IF NOT EXISTS public.usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL REFERENCES public.empresa(id) ON DELETE CASCADE,

    rol_id UUID NOT NULL REFERENCES public.rol(id) ON DELETE RESTRICT,

    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,

    activo BOOLEAN NOT NULL DEFAULT TRUE,
	
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	last_login TIMESTAMPTZ
);


-- =========================================
-- CLIENTE
-- =========================================
CREATE TABLE IF NOT EXISTS public.cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT null REFERENCES public.empresa(id) ON DELETE CASCADE,

    identificacion TEXT NOT NULL,
    tipo_identificacion TEXT NOT NULL, -- CEDULA | RUC | PASAPORTE
    razon_social TEXT NOT NULL,
    email TEXT,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Un cliente no se repite dentro de la misma empresa
    CONSTRAINT uq_cliente_empresa_identificacion UNIQUE (empresa_id, identificacion)
);

-- =========================================
-- Revisar si esta bien asi, no lo implementare aun
-- FACTURA 
-- =========================================
CREATE TABLE IF NOT EXISTS public.factura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT null REFERENCES public.empresa(id) ON DELETE CASCADE,

    cliente_id UUID NOT null REFERENCES public.cliente(id) ON DELETE RESTRICT,

    numero_factura TEXT NOT NULL UNIQUE,

    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,

    total NUMERIC(10,2) NOT NULL,

    estado TEXT NOT NULL DEFAULT 'EMITIDA',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- PAGO_SUSCRIPCION
-- =========================================
CREATE TABLE IF NOT EXISTS public.pago_suscripcion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT null REFERENCES public.empresa(id) ON DELETE CASCADE,

    plan_id UUID NOT null REFERENCES public.plan(id) ON DELETE RESTRICT,

    monto NUMERIC(10,2) NOT NULL,

    -- Fechas de negocio (contables)
    fecha_pago DATE NOT NULL,
    fecha_inicio_periodo DATE NOT NULL,
    fecha_fin_periodo DATE NOT NULL,

    metodo_pago TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE',

    comprobante_url TEXT,
    observaciones TEXT,

    -- Auditoría (UTC)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- =========================================
-- COMISION
-- =========================================
CREATE TABLE IF NOT EXISTS public.comision (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vendedor_id UUID NOT NULL
        REFERENCES public.vendedor(id)
        ON DELETE RESTRICT,

    pago_suscripcion_id UUID NOT NULL
        REFERENCES public.pago_suscripcion(id)
        ON DELETE CASCADE,

    monto NUMERIC(10,2) NOT NULL,
    porcentaje_aplicado NUMERIC(5,2) NOT NULL,

    estado TEXT NOT NULL DEFAULT 'PENDIENTE',

    -- Fechas de negocio
    fecha_generacion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_pago DATE,

    metodo_pago TEXT,
    observaciones TEXT,

    -- Auditoría (UTC)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Una comisión por pago
    CONSTRAINT uq_comision_pago UNIQUE (pago_suscripcion_id)
);

-- =========================================
-- SUPERADMIN SESSIONS
-- =========================================
CREATE TABLE IF NOT EXISTS public.superadmin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- FK debe ser UUID, no INT
    superadmin_id UUID NOT NULL
        REFERENCES public.superadmin(id)
        ON DELETE CASCADE,

    is_valid BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    user_agent TEXT,
    ip_address TEXT
);

-- =========================================
-- VENDEDOR SESSIONS
-- =========================================
CREATE TABLE IF NOT EXISTS public.vendedor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- FK a vendedor
    vendedor_id UUID NOT NULL
        REFERENCES public.vendedor(id)
        ON DELETE CASCADE,

    is_valid BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    user_agent TEXT,
    ip_address TEXT
);

-- =========================================
-- USER SESSIONS (Usuarios)
-- =========================================
CREATE TABLE IF NOT EXISTS public.usuario_sesiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID NOT NULL REFERENCES public.usuario(id) ON DELETE CASCADE,

    is_valid BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,

    user_agent TEXT,
    ip_address TEXT
);