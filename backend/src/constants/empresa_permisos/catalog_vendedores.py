from .base import ModuloPermisos

VENDEDORES_PERMS = {
    # MÓDULO: VENDEDORES (Admin)
    "VENDEDORES_VER": {
        "codigo": "VENDEDORES_VER",
        "nombre": "Ver Vendedores",
        "modulo": ModuloPermisos.VENDEDORES,
        "descripcion": "Permite visualizar el listado de vendedores."
    },
    "VENDEDORES_GESTIONAR": {
        "codigo": "VENDEDORES_GESTIONAR",
        "nombre": "Gestionar Vendedores",
        "modulo": ModuloPermisos.VENDEDORES,
        "descripcion": "Permite crear, editar y gestionar vendedores del sistema."
    },
}
