from enum import Enum

class ErrorMessages(str, Enum):
    # General Auth
    UNAUTHORIZED = "No autorizado"
    FORBIDDEN = "No tienes permisos suficientes"
    USER_NOT_IN_COMPANY = "Usuario no asociado a una empresa"
    
    # Roles
    ROLE_NOT_FOUND = "Rol no encontrado o sin acceso"
    ROLE_ACCESS_DENIED = "No tienes acceso a este rol"
    SYSTEM_ROLE_MODIFICATION = "No puedes modificar roles de sistema"
    SYSTEM_ROLE_DELETION = "No puedes eliminar roles de sistema"
    ROLE_ID_MISMATCH = "El ID del rol en el cuerpo no coincide con la URL"
    CREATE_ROLE_ERROR = "Error al crear rol"
    UPDATE_ROLE_ERROR = "Rol no encontrado o error al actualizar"
    DELETE_ROLE_ERROR = "Rol no encontrado"
    
    # Permissions
    SUPERADMIN_ONLY_CREATE = "Solo los Superadmins pueden crear permisos del sistema"
    SUPERADMIN_ONLY_UPDATE = "Solo los Superadmins pueden modificar permisos del sistema"
    SUPERADMIN_ONLY_DELETE = "Solo los Superadmins pueden eliminar permisos del sistema"
    PERMISSION_ADD_ERROR = "Error al agregar permiso"
    PERMISSION_REMOVE_ERROR = "Error al eliminar permiso"
    PERMISSION_LIST_REQUIRED = "Se requiere una lista con [rol_id, permiso_id]"
    PERMISSION_NOT_ASSIGNED = "Permiso no asignado a este rol"
    ASSIGN_PERMISSIONS_ERROR = "Error al asignar permisos"
    PERMISSION_NOT_FOUND = "Permiso no encontrado"
    CREATE_PERMISSION_ERROR = "Error al crear permiso"
    UPDATE_PERMISSION_ERROR = "Error al actualizar permiso"
    DELETE_PERMISSION_ERROR = "Error al eliminar permiso"
    
    # Subscription / Payment
    PAYMENT_PROCESS_ERROR = "El pago no pudo ser procesado"
    PAYMENT_DB_ERROR = "Error al procesar el pago en base de datos"
    PAYMENT_NOT_FOUND = "Pago no encontrado"
    PAYMENT_ACCESS_DENIED = "No tienes acceso a este pago"
    PAYMENT_ADMIN_REQUIRED = "Se requiere rol ADMIN o OWNER para registrar pagos"
    PAYMENT_VIEW_ADMIN_REQUIRED = "Se requiere rol ADMIN o OWNER para ver el historial de pagos"
    PAYMENT_DETAIL_ADMIN_REQUIRED = "Se requiere rol ADMIN o OWNER para ver el detalle del pago"
    PAYMENT_COMPANY_MISMATCH = "No puedes registrar pagos para otra empresa"
    
    # Plans
    PLAN_NOT_FOUND = "El plan especificado no existe"
    PLAN_NOT_ACTIVE = "El plan especificado no está activo"
    INVALID_DATE_RANGE = "La fecha de inicio debe ser anterior a la fecha de fin"
