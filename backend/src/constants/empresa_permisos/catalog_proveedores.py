from .base import ModuloPermisos

PROVEEDOR_PERMS = {
    "PROVEEDOR_VER": {
        "codigo": "PROVEEDOR_VER",
        "nombre": "Ver Proveedores",
        "modulo": ModuloPermisos.PROVEEDORES,
        "descripcion": "Permite visualizar el listado y detalles de los proveedores."
    },
    "PROVEEDOR_CREAR": {
        "codigo": "PROVEEDOR_CREAR",
        "nombre": "Crear Proveedores",
        "modulo": ModuloPermisos.PROVEEDORES,
        "descripcion": "Permite registrar nuevos proveedores en el sistema."
    },
    "PROVEEDOR_EDITAR": {
        "codigo": "PROVEEDOR_EDITAR",
        "nombre": "Editar Proveedores",
        "modulo": ModuloPermisos.PROVEEDORES,
        "descripcion": "Permite modificar la información de proveedores existentes."
    },
    "PROVEEDOR_ELIMINAR": {
        "codigo": "PROVEEDOR_ELIMINAR",
        "nombre": "Eliminar Proveedores",
        "modulo": ModuloPermisos.PROVEEDORES,
        "descripcion": "Permite dar de baja o eliminar proveedores del sistema."
    },
}
