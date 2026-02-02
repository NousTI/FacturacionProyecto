-- =========================================
-- AUDITORÍA: creación de usuarios
-- =========================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.usuario_creacion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Usuario creado
    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id)
        ON DELETE CASCADE,

    -- Quién lo creó (NULL = sistema)
    actor_user_id UUID
        REFERENCES sistema_facturacion.users(id)
        ON DELETE SET NULL,

    -- Snapshot del contexto
    actor_rol_sistema TEXT NOT NULL,
    actor_rol_empresa TEXT,

    empresa_id UUID
        REFERENCES sistema_facturacion.empresas(id)
        ON DELETE SET NULL,

    -- Tipo de origen
    origen TEXT NOT NULL
        CHECK (origen IN ('superadmin', 'vendedor', 'sistema')),

    -- Metadata opcional
    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cómo se usa (reglas claras)
-- Caso 1: lo crea un superadmin
-- actor_user_id = UUID del superadmin
-- actor_rol_sistema = 'superadmin'
-- actor_rol_empresa = NULL
-- origen = 'superadmin'

-- Caso 2: lo crea un vendedor
-- actor_user_id = UUID del vendedor
-- actor_rol_sistema = 'usuario'
-- actor_rol_empresa = 'vendedor'
-- origen = 'vendedor'
-- empresa_id = empresa del vendedor

-- Caso 3: lo crea el sistema
-- actor_user_id = NULL
-- actor_rol_sistema = 'sistema'
-- actor_rol_empresa = NULL
-- origen = 'sistema'