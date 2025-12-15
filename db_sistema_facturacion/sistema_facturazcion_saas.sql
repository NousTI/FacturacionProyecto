-- =========================================
-- EXTENSIÓN PARA UUID
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
CREATE TABLE vendedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    telefono TEXT,
    documento_identidad TEXT,
    porcentaje_comision NUMERIC(5,2),
    tipo_comision TEXT,
    puede_crear_empresas BOOLEAN DEFAULT FALSE,
    puede_gestionar_planes BOOLEAN DEFAULT FALSE,
    puede_ver_reportes BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    configuracion JSONB
);

-- =========================================
-- PLAN
-- =========================================
CREATE TABLE plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    precio_mensual NUMERIC(10,2) NOT NULL,
    max_usuarios INT,
    max_facturas_mes INT,
    max_establecimientos INT,
    facturacion_programada BOOLEAN DEFAULT FALSE,
    caracteristicas JSONB,
    visible_publico BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE
);

-- =========================================
-- EMPRESA
-- =========================================
CREATE TABLE empresa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID REFERENCES vendedor(id),
    plan_id UUID REFERENCES plan(id),
    ruc TEXT UNIQUE NOT NULL,
    razon_social TEXT NOT NULL,
    nombre_comercial TEXT,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    logo_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    fecha_activacion DATE,
    fecha_vencimiento DATE,
    estado_suscripcion TEXT,
    tipo_contribuyente TEXT,
    obligado_contabilidad BOOLEAN DEFAULT FALSE
);

-- =========================================
-- ROL
-- =========================================
CREATE TABLE rol (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresa(id),
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    es_sistema BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- PERMISO
-- =========================================
CREATE TABLE permiso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    modulo TEXT,
    descripcion TEXT,
    tipo TEXT
);

-- =========================================
-- ROL_PERMISO
-- =========================================
CREATE TABLE rol_permiso (
    rol_id UUID REFERENCES rol(id) ON DELETE CASCADE,
    permiso_id UUID REFERENCES permiso(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (rol_id, permiso_id)
);

-- =========================================
-- USUARIO
-- =========================================
CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
    rol_id UUID REFERENCES rol(id),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- CLIENTE
-- =========================================
CREATE TABLE cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
    identificacion TEXT UNIQUE NOT NULL,
    tipo_identificacion TEXT,
    razon_social TEXT NOT NULL,
    email TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- =========================================
-- FACTURA
-- =========================================
CREATE TABLE factura (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES cliente(id),
    numero_factura TEXT UNIQUE NOT NULL,
    fecha_emision DATE DEFAULT CURRENT_DATE,
    total NUMERIC(10,2) NOT NULL,
    estado TEXT
);

-- =========================================
-- PAGO_SUSCRIPCION
-- =========================================
CREATE TABLE pago_suscripcion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresa(id),
    plan_id UUID REFERENCES plan(id),
    monto NUMERIC(10,2) NOT NULL,
    fecha_pago DATE NOT NULL,
    fecha_inicio_periodo DATE NOT NULL,
    fecha_fin_periodo DATE NOT NULL,
    metodo_pago TEXT,
    estado TEXT,
    comprobante_url TEXT,
    observaciones TEXT
);

-- =========================================
-- COMISION
-- =========================================
CREATE TABLE comision (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID REFERENCES vendedor(id),
    pago_suscripcion_id UUID REFERENCES pago_suscripcion(id),
    monto NUMERIC(10,2) NOT NULL,
    porcentaje_aplicado NUMERIC(5,2),
    estado TEXT,
    fecha_generacion DATE DEFAULT CURRENT_DATE,
    fecha_pago DATE,
    metodo_pago TEXT,
    observaciones TEXT
);

-- =========================================
-- SUPERADMIN SESSIONS
-- =========================================
CREATE TABLE IF NOT EXISTS superadmin_sessions (
    id TEXT PRIMARY KEY,
    superadmin_id UUID REFERENCES superadmin(id) ON DELETE CASCADE,
    is_valid BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- VENDEDOR SESSIONS
-- =========================================
CREATE TABLE IF NOT EXISTS vendedor_sessions (
    id TEXT PRIMARY KEY,
    vendedor_id UUID REFERENCES vendedor(id) ON DELETE CASCADE,
    is_valid BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
