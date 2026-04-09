from .base import ModuloPermisos

PRODUCTOS_PERMS = {
    "PRODUCTOS_VER": {
        "codigo": "PRODUCTOS_VER",
        "nombre": "Ver Productos",
        "modulo": ModuloPermisos.PRODUCTOS,
        "descripcion": "Permite visualizar el catálogo de productos."
    },
    "PRODUCTOS_CREAR": {
        "codigo": "PRODUCTOS_CREAR",
        "nombre": "Crear Productos",
        "modulo": ModuloPermisos.PRODUCTOS,
        "descripcion": "Permite registrar nuevos productos."
    },
    "PRODUCTOS_EDITAR": {
        "codigo": "PRODUCTOS_EDITAR",
        "nombre": "Editar Productos",
        "modulo": ModuloPermisos.PRODUCTOS,
        "descripcion": "Permite modificar productos existentes."
    },
    "PRODUCTOS_ELIMINAR": {
        "codigo": "PRODUCTOS_ELIMINAR",
        "nombre": "Eliminar Productos",
        "modulo": ModuloPermisos.PRODUCTOS,
        "descripcion": "Permite eliminar productos."
    },
    "PRODUCTOS_VER_COSTOS": {
        "codigo": "PRODUCTOS_VER_COSTOS",
        "nombre": "Ver Costos de Productos",
        "modulo": ModuloPermisos.PRODUCTOS,
        "descripcion": "Permite visualizar los costos y márgenes de ganancia de los productos."
    },
}
