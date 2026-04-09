-- ================================================================
-- VINCULACIÓN MASIVA DE PERMISOS A ROLES ADMINISTRATIVOS
-- Asigna todos los permisos del catálogo a los 3 roles de sistema
-- ================================================================

INSERT INTO sistema_facturacion.empresa_roles_permisos (rol_id, permiso_id, activo)
SELECT 
    r.id AS rol_id, 
    p.id AS permiso_id, 
    TRUE AS activo
FROM (
    VALUES 
        ('db4092fd-6df6-4383-92c9-54b4057bcd67'::UUID),
        ('e023ea9d-e39d-4e96-ab56-0fdc040656a9'::UUID),
        ('7e8b6e00-91c7-457f-adf6-20b075624e46'::UUID)
) AS r(id)
CROSS JOIN sistema_facturacion.empresa_permisos p
ON CONFLICT (rol_id, permiso_id) 
DO UPDATE SET 
    activo = TRUE,
    updated_at = NOW();
