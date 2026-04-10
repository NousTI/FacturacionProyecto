from .base import ModuloPermisos

USUARIOS_PERMS = {
    # --- USUARIOS DE EMPRESA ---
    "USUARIOS_EMPRESA_VER": {
        "codigo": "USUARIOS_EMPRESA_VER",
        "nombre": "Ver Usuarios de Empresa",
        "modulo": ModuloPermisos.USUARIOS_EMPRESA,
        "descripcion": "Permite visualizar el listado de usuarios de la empresa."
    },
    "USUARIOS_EMPRESA_CREAR": {
        "codigo": "USUARIOS_EMPRESA_CREAR",
        "nombre": "Crear Usuarios de Empresa",
        "modulo": ModuloPermisos.USUARIOS_EMPRESA,
        "descripcion": "Permite registrar nuevos usuarios para la empresa."
    },
    "USUARIOS_EMPRESA_EDITAR": {
        "codigo": "USUARIOS_EMPRESA_EDITAR",
        "nombre": "Editar Usuarios de Empresa",
        "modulo": ModuloPermisos.USUARIOS_EMPRESA,
        "descripcion": "Permite modificar datos de usuarios existentes."
    },
    "USUARIOS_EMPRESA_ELIMINAR": {
        "codigo": "USUARIOS_EMPRESA_ELIMINAR",
        "nombre": "Eliminar Usuarios de Empresa",
        "modulo": ModuloPermisos.USUARIOS_EMPRESA,
        "descripcion": "Permite desactivar o eliminar usuarios."
    },
    "USUARIOS_VER": {
        "codigo": "USUARIOS_VER",
        "nombre": "Ver Usuarios",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite visualizar el listado de usuarios de la empresa."
    },
    "USUARIOS_GESTIONAR": {
        "codigo": "USUARIOS_GESTIONAR",
        "nombre": "Gestionar Usuarios",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite crear, editar, desactivar y resetear claves de usuarios."
    },
}
