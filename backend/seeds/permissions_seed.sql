-- Semillas para Permisos de PagoFactura y LogEmision
-- Ejecutar este script en la base de datos para habilitar los nuevos módulos.

-- 1. Insertar Permisos
INSERT INTO public.permiso (nombre, codigo, descripcion, modulo) VALUES
('Ver Pagos', 'PAGO_VER', 'Permite visualizar el historial de pagos de facturas', 'PAGOS'),
('Crear Pagos', 'PAGO_CREAR', 'Permite registrar nuevos pagos a facturas', 'PAGOS'),
('Anular Pagos', 'PAGO_ANULAR', 'Permite anular un pago registrado', 'PAGOS'),
('Ver Logs Emisión', 'LOG_EMISION_VER', 'Permite ver los logs de intentos de emisión de facturas', 'LOGS')
ON CONFLICT (codigo) DO NOTHING;

-- 2. Asignar Permisos a Roles (Ejemplo Genérico - Ajustar UUIDs según DB real)
-- Obtener IDs de Permisos
-- SELECT id FROM permiso WHERE codigo IN ('PAGO_VER', 'PAGO_CREAR', 'PAGO_ANULAR', 'LOG_EMISION_VER');

-- Asignar a Rol 'Administrador' (Reemplazar 'UUID_ROL_ADMIN' con el ID real)
-- INSERT INTO public.rol_permiso (rol_id, permiso_id)
-- SELECT 'UUID_ROL_ADMIN', id FROM permiso WHERE codigo IN ('PAGO_VER', 'PAGO_CREAR', 'LOG_EMISION_VER')
-- ON CONFLICT DO NOTHING;

-- Asignar a Rol 'Vendedor' (Reemplazar 'UUID_ROL_VENDEDOR' con el ID real)
-- INSERT INTO public.rol_permiso (rol_id, permiso_id)
-- SELECT 'UUID_ROL_VENDEDOR', id FROM permiso WHERE codigo IN ('PAGO_VER', 'PAGO_CREAR')
-- ON CONFLICT DO NOTHING;
