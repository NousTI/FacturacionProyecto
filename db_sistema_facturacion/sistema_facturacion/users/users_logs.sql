-- =====================================================
-- MÓDULO: AUTENTICACIÓN
-- TABLA: users_logs
-- Descripción:
-- Registro de eventos de autenticación y seguridad.
-- Solo INSERT. Nunca UPDATE ni DELETE.
-- =====================================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.users_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Usuario autenticado (si existe)
    user_id UUID
        REFERENCES sistema_facturacion.users(id)
        ON DELETE SET NULL,

    -- Tipo de evento de autenticación
    evento TEXT NOT NULL
        CHECK (evento IN ('LOGIN_OK','LOGIN_FALLIDO','LOGOUT','PASSWORD_CAMBIADA','CUENTA_BLOQUEADA','CUENTA_DESBLOQUEADA','CUENTA_DESHABILITADA')),

    -- Origen del evento
    origen TEXT NOT NULL DEFAULT 'SISTEMA'
        CHECK (origen IN ('SISTEMA', 'SUPERADMIN', 'USUARIO')),

    -- Información técnica (seguridad)
    ip_address TEXT,
    user_agent TEXT,

    -- Motivo / detalle (opcional)
    motivo TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Logs por usuario
CREATE INDEX IF NOT EXISTS idx_users_logs_user
ON sistema_facturacion.users_logs (user_id);

-- Logs por evento
CREATE INDEX IF NOT EXISTS idx_users_logs_evento
ON sistema_facturacion.users_logs (evento);

-- Logs por fecha
CREATE INDEX IF NOT EXISTS idx_users_logs_created_at
ON sistema_facturacion.users_logs (created_at);


LOGIN_OK -> Inicio de sesión exitoso del usuario
LOGIN_FALLIDO -> Intento de inicio de sesión fallido
LOGOUT -> Cierre de sesión del usuario
PASSWORD_CAMBIADA -> El usuario cambió su contraseña
CUENTA_BLOQUEADA -> La cuenta fue bloqueada por el sistema
CUENTA_DESBLOQUEADA -> La cuenta fue desbloqueada por el sistema o un administrador
CUENTA_DESHABILITADA -> La cuenta fue deshabilitada por el sistema o un administrador