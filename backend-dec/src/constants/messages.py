from enum import Enum

class AuthMessages(str, Enum):
    UNAUTHORIZED = "No autorizado"
    FORBIDDEN = "No tienes permisos suficientes"
    USER_NOT_IN_COMPANY = "Usuario no asociado a una empresa"

class RoleMessages(str, Enum):
    NOT_FOUND = "Rol no encontrado o sin acceso"
    ACCESS_DENIED = "No tienes acceso a este rol"
    SYSTEM_MODIFICATION = "No puedes modificar roles de sistema"
    SYSTEM_DELETION = "No puedes eliminar roles de sistema"
    ID_MISMATCH = "El ID del rol en el cuerpo no coincide con la URL"
    CREATE_ERROR = "Error al crear rol"
    UPDATE_ERROR = "Rol no encontrado o error al actualizar"
    DELETE_ERROR = "Rol no encontrado"

class PermissionMessages(str, Enum):
    SUPERADMIN_ONLY_CREATE = "Solo los Superadmins pueden crear permisos del sistema"
    SUPERADMIN_ONLY_UPDATE = "Solo los Superadmins pueden modificar permisos del sistema"
    SUPERADMIN_ONLY_DELETE = "Solo los Superadmins pueden eliminar permisos del sistema"
    ADD_ERROR = "Error al agregar permiso"
    REMOVE_ERROR = "Error al eliminar permiso"
    LIST_REQUIRED = "Se requiere una lista con [rol_id, permiso_id]"
    NOT_ASSIGNED = "Permiso no asignado a este rol"
    ASSIGN_ERROR = "Error al asignar permisos"
    NOT_FOUND = "Permiso no encontrado"
    CREATE_ERROR = "Error al crear permiso"
    UPDATE_ERROR = "Error al actualizar permiso"
    DELETE_ERROR = "Error al eliminar permiso"

class PaymentMessages(str, Enum):
    PROCESS_ERROR = "El pago no pudo ser procesado"
    DB_ERROR = "Error al procesar el pago en base de datos"
    NOT_FOUND = "Pago no encontrado"
    ACCESS_DENIED = "No tienes acceso a este pago"
    ADMIN_REQUIRED = "Se requiere rol ADMIN o OWNER para registrar pagos"
    VIEW_ADMIN_REQUIRED = "Se requiere rol ADMIN o OWNER para ver el historial de pagos"
    DETAIL_ADMIN_REQUIRED = "Se requiere rol ADMIN o OWNER para ver el detalle del pago"
    COMPANY_MISMATCH = "No puedes registrar pagos para otra empresa"

class PlanMessages(str, Enum):
    NOT_FOUND = "El plan especificado no existe"
    NOT_ACTIVE = "El plan especificado no está activo"
    INVALID_DATE_RANGE = "La fecha de inicio debe ser anterior a la fecha de fin"

class UserMessages(str, Enum):
    COMPANY_MISMATCH = "No puedes crear usuarios para otra empresa"

class ErrorMessages(str, Enum):
    # Mapping for convenience
    UNAUTHORIZED = AuthMessages.UNAUTHORIZED
    FORBIDDEN = AuthMessages.FORBIDDEN
    PERMISSION_NOT_FOUND = PermissionMessages.NOT_FOUND
    # ... Add others as needed
