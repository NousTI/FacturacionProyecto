from .base import ModuloPermisos

CLIENTES_PERMS = {
    "CLIENTES_VER": {
        "codigo": "CLIENTES_VER",
        "nombre": "Ver Clientes",
        "modulo": ModuloPermisos.CLIENTES,
        "descripcion": "Permite visualizar el listado y detalles de los clientes."
    },
    "CLIENTES_CREAR": {
        "codigo": "CLIENTES_CREAR",
        "nombre": "Crear Clientes",
        "modulo": ModuloPermisos.CLIENTES,
        "descripcion": "Permite registrar nuevos clientes en el sistema."
    },
    "CLIENTES_EDITAR": {
        "codigo": "CLIENTES_EDITAR",
        "nombre": "Editar Clientes",
        "modulo": ModuloPermisos.CLIENTES,
        "descripcion": "Permite modificar la información de clientes existentes."
    },
    "CLIENTES_ELIMINAR": {
        "codigo": "CLIENTES_ELIMINAR",
        "nombre": "Eliminar Clientes",
        "modulo": ModuloPermisos.CLIENTES,
        "descripcion": "Permite dar de baja o eliminar clientes del sistema."
    },
    "CLIENTES_EXPORTAR": {
        "codigo": "CLIENTES_EXPORTAR",
        "nombre": "Exportar Clientes",
        "modulo": ModuloPermisos.CLIENTES,
        "descripcion": "Permite exportar el listado de clientes a formatos externos (Excel, CSV)."
    },
}
