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
    # MÓDULO: UNIDADES DE MEDIDA
    "UNIDAD_MEDIDA_VER": {
        "codigo": "UNIDAD_MEDIDA_VER",
        "nombre": "Ver Unidades de Medida",
        "modulo": ModuloPermisos.INVENTARIOS,
        "descripcion": "Permite visualizar las unidades de medida."
    },
    "UNIDAD_MEDIDA_GESTIONAR": {
        "codigo": "UNIDAD_MEDIDA_GESTIONAR",
        "nombre": "Gestionar Unidades de Medida",
        "modulo": ModuloPermisos.INVENTARIOS,
        "descripcion": "Permite crear, editar y eliminar unidades de medida."
    },
    # MÓDULO: TIPOS DE MOVIMIENTO
    "TIPO_MOVIMIENTO_VER": {
        "codigo": "TIPO_MOVIMIENTO_VER",
        "nombre": "Ver Tipos de Movimiento",
        "modulo": ModuloPermisos.INVENTARIOS,
        "descripcion": "Permite visualizar los tipos de movimiento de inventario."
    },
    "TIPO_MOVIMIENTO_GESTIONAR": {
        "codigo": "TIPO_MOVIMIENTO_GESTIONAR",
        "nombre": "Gestionar Tipos de Movimiento",
        "modulo": ModuloPermisos.INVENTARIOS,
        "descripcion": "Permite crear, editar y eliminar tipos de movimiento."
    },
}
