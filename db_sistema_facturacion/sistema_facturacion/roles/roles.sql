-- =========================================
-- ROLES DE SISTEMA
-- =========================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO sistema_facturacion.roles (codigo, nombre, descripcion) VALUES
('SUPERADMIN', 'Superadmin', 'Control total del sistema'),
('VENDEDOR', 'Vendedor', 'Acceso comercial limitado'),
('USUARIO', 'Usuario', 'Acceso a empresas asignadas');
