class AppMessages:
    # AUTH
    AUTH_CREDENTIALS_INVALID = "El correo electrónico o la contraseña son incorrectos."
    AUTH_USER_NOT_FOUND = "El usuario no se encuentra registrado en el sistema."
    AUTH_PASSWORD_MISMATCH = "La contraseña ingresada no es correcta."
    AUTH_TOKEN_INVALID = "El token de acceso es inválido o ha sido revocado."
    AUTH_TOKEN_EXPIRED = "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
    AUTH_INACTIVE_USER = "Tu cuenta se encuentra inactiva. Contacta al administrador."
    AUTH_SESSION_EXPIRED = "La sesión ha caducado por inactividad."
    AUTH_SESSION_ALREADY_ACTIVE = "Ya tienes una sesión activa en otro navegador o dispositivo. Por favor, cierra la otra sesión antes de continuar."

    # PERMISSIONS
    PERM_FORBIDDEN = "No tienes permisos suficientes para realizar esta acción."
    PERM_INSUFFICIENT_ROLE = "Tu rol actual no permite acceder a este recurso."

    # DATABASE/RESOURCES
    DB_NOT_FOUND = "El recurso solicitado no existe."
    DB_CONSTRAINT_VIOLATION = "No se puede completar la operación debido a conflictos con datos existentes."

    # VALIDATION
    VAL_INVALID_INPUT = "Los datos ingresados no son válidos."
    
    # SYSTEM
    SYS_INTERNAL_ERROR = "Ha ocurrido un error inesperado en el sistema. Por favor, intenta más tarde."

class RoleMessages:
    NOT_FOUND = "El rol solicitado no existe."
    SYSTEM_MODIFICATION = "No se permiten modificaciones en roles del sistema."
    SYSTEM_DELETION = "No se pueden eliminar roles protegidos del sistema."
    UPDATE_ERROR = "No se pudo actualizar el rol. Verifique los datos."
    DELETE_ERROR = "No se pudo eliminar el rol. Puede estar en uso."
    ADD_ERROR = "Error al asignar el permiso al rol."
    REMOVE_ERROR = "Error al remover el permiso del rol."
