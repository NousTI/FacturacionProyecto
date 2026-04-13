from .base import ModuloPermisos

ROLES_PERMS = {
    # --- ROLES ---
    "CONFIG_ROLES": {
        "codigo": "CONFIG_ROLES",
        "nombre": "Gestionar Roles y Permisos",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite crear roles y asignarles permisos específicos."
    },
}
