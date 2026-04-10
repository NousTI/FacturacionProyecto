from .base import ModuloPermisos

INVENTARIO_PERMS = {
    # MÓDULO: INVENTARIOS
    "INVENTARIO_VER": {
        "codigo": "INVENTARIO_VER",
        "nombre": "Ver Inventario",
        "modulo": ModuloPermisos.INVENTARIOS,
        "descripcion": "Permite visualizar los movimientos y estado del inventario."
    },
    "INVENTARIO_CREAR": {
        "codigo": "INVENTARIO_CREAR",
        "nombre": "Crear Movimientos de Inventario",
        "modulo": ModuloPermisos.INVENTARIOS,
        "descripcion": "Permite registrar nuevos movimientos de inventario."
    },
    "INVENTARIO_EDITAR": {
        "codigo": "INVENTARIO_EDITAR",
        "nombre": "Editar Movimientos de Inventario",
        "modulo": ModuloPermisos.INVENTARIOS,
        "descripcion": "Permite modificar movimientos de inventario existentes."
    },
    "INVENTARIO_ELIMINAR": {
        "codigo": "INVENTARIO_ELIMINAR",
        "nombre": "Eliminar Movimientos de Inventario",
        "modulo": ModuloPermisos.INVENTARIOS,
        "descripcion": "Permite eliminar movimientos de inventario."
    },
    # MÓDULO: PROVEEDORES
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
        "descripcion": "Permite registrar nuevos proveedores."
    },
    "PROVEEDOR_EDITAR": {
        "codigo": "PROVEEDOR_EDITAR",
        "nombre": "Editar Proveedores",
        "modulo": ModuloPermisos.PROVEEDORES,
        "descripcion": "Permite modificar información de proveedores existentes."
    },
    "PROVEEDOR_ELIMINAR": {
        "codigo": "PROVEEDOR_ELIMINAR",
        "nombre": "Eliminar Proveedores",
        "modulo": ModuloPermisos.PROVEEDORES,
        "descripcion": "Permite dar de baja o eliminar proveedores."
    },
}
