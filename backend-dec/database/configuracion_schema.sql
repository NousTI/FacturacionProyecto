-- backend/database/configuracion_schema.sql

-- =====================================================
-- CONFIGURACIÓN GLOBAL
-- =====================================================
CREATE TABLE IF NOT EXISTS public.configuracion_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT DEFAULT 'GENERAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for quick lookup
CREATE INDEX IF NOT EXISTS idx_config_global_clave ON public.configuracion_global(clave);

-- =====================================================
-- CATÁLOGOS DEL SAAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.catalogo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- FEATURE FLAGS / MODO MANTENIMIENTO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.feature_flag (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT FALSE,
    descripcion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PLANTILLAS DE NOTIFICACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.plantilla_notificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    titulo TEXT NOT NULL,
    contenido_html TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INITIAL DATA (Seeding)
-- =====================================================
INSERT INTO public.configuracion_global (clave, valor, descripcion, categoria)
VALUES 
('comision_defecto', '10', 'Porcentaje de comisión por defecto para vendedores', 'COMMISSIONS'),
('dias_tolerancia_vencimiento', '5', 'Días de gracia antes de suspender servicio tras vencimiento', 'SUBSCRIPTIONS')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO public.feature_flag (codigo, activo, descripcion)
VALUES 
('MAINTENANCE_MODE', FALSE, 'Activa el modo mantenimiento global del sistema'),
('FACTURACION_ELECTRONICA_PRO', TRUE, 'Habilita módulos avanzados de facturación')
ON CONFLICT (codigo) DO NOTHING;
