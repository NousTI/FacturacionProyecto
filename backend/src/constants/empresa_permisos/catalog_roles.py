from .base import ModuloPermisos

ROLES_PERMS = {
    # --- ROLES ---
    "ROLES_VER": {
        "codigo": "ROLES_VER",
        "nombre": "Ver Roles",
        "modulo": ModuloPermisos.ROLES,
        "descripcion": "Permite visualizar los roles configurados."
    },
    "ROLES_CREAR": {
        "codigo": "ROLES_CREAR",
        "nombre": "Crear Roles",
        "modulo": ModuloPermisos.ROLES,
        "descripcion": "Permite crear nuevos roles de usuario."
    },
    "ROLES_EDITAR": {
        "codigo": "ROLES_EDITAR",
        "nombre": "Editar Roles",
        "modulo": ModuloPermisos.ROLES,
        "descripcion": "Permite modificar permisos y nombres de roles existentes."
    },
    "ROLES_ELIMINAR": {
        "codigo": "ROLES_ELIMINAR",
        "nombre": "Eliminar Roles",
        "modulo": ModuloPermisos.ROLES,
        "descripcion": "Permite eliminar roles que no estén en uso."
    },
    "CONFIG_ROLES": {
        "codigo": "CONFIG_ROLES",
        "nombre": "Gestionar Roles y Permisos",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite crear roles y asignarles permisos específicos."
    },
}
