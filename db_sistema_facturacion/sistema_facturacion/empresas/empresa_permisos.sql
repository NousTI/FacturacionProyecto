-- =========================================
-- MÓDULO: SEGURIDAD / PERMISOS
-- TABLA: empresa_permisos
-- Descripción: Catálogo de permisos disponibles en el sistema.
-- Los roles solo agrupan estos permisos.
-- =========================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.empresa_permisos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificador único del permiso (uso técnico)
    codigo TEXT NOT NULL UNIQUE,

    -- Nombre legible para UI / administración
    nombre TEXT NOT NULL,

    -- Módulo funcional del sistema
    -- Ej: FACTURACION, CLIENTES, USUARIOS, REPORTES
    modulo TEXT NOT NULL,

    -- Descripción funcional del permiso
    descripcion TEXT,

    -- Tipo de permiso (nivel de impacto)
    tipo TEXT NOT NULL
        CHECK (tipo IN ('LECTURA', 'ACCION', 'ADMIN', 'SISTEMA')),

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
