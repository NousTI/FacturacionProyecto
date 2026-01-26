-- =====================================================
-- MÓDULO: AUTENTICACIÓN
-- TABLA: users
-- Descripción:
-- Identidad única de acceso al sistema.
-- Centraliza email, password y estado.
-- =====================================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email TEXT NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    estado TEXT NOT NULL DEFAULT 'ACTIVA'
        CHECK (estado IN ('ACTIVA', 'BLOQUEADA', 'DESHABILITADA')),

    ultimo_acceso TIMESTAMPTZ,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ACTIVA -> Usuario activo en el sistema
BLOQUEADA -> Usuario bloqueado por el sistema
DESHABILITADA -> Usuario deshabilitado por el sistema