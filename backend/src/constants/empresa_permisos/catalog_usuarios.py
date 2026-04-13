from .base import ModuloPermisos

USUARIOS_PERMS = {
    # --- USUARIOS ---
    "USUARIOS_VER": {
        "codigo": "USUARIOS_VER",
        "nombre": "Ver Usuarios de Empresa",
        "modulo": ModuloPermisos.USUARIOS,
        "descripcion": "Permite visualizar el listado de usuarios de la empresa."
    },
    "USUARIOS_CREAR": {
        "codigo": "USUARIOS_CREAR",
        "nombre": "Crear Usuarios de Empresa",
        "modulo": ModuloPermisos.USUARIOS,
        "descripcion": "Permite registrar nuevos usuarios para la empresa."
    },
    "USUARIOS_EDITAR": {
        "codigo": "USUARIOS_EDITAR",
        "nombre": "Editar Usuarios de Empresa",
        "modulo": ModuloPermisos.USUARIOS,
        "descripcion": "Permite modificar datos de usuarios existentes."
    },
    "USUARIOS_ELIMINAR": {
        "codigo": "USUARIOS_ELIMINAR",
        "nombre": "Eliminar Usuarios de Empresa",
        "modulo": ModuloPermisos.USUARIOS,
        "descripcion": "Permite desactivar o eliminar usuarios."
    },
}
