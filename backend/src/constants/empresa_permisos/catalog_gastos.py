from .base import ModuloPermisos

GASTOS_PERMS = {
    # MÓDULO: GASTOS
    "GASTOS_VER": {
        "codigo": "GASTOS_VER",
        "nombre": "Ver Gastos",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite visualizar el listado y detalles de gastos registrados."
    },
    "GASTOS_CREAR": {
        "codigo": "GASTOS_CREAR",
        "nombre": "Crear Gastos",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite registrar nuevos gastos en el sistema."
    },
    "GASTOS_EDITAR": {
        "codigo": "GASTOS_EDITAR",
        "nombre": "Editar Gastos",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite modificar gastos existentes."
    },
    "GASTOS_ELIMINAR": {
        "codigo": "GASTOS_ELIMINAR",
        "nombre": "Eliminar Gastos",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite eliminar gastos del sistema."
    },
    # CATEGORÍAS
    "CATEGORIA_GASTO_VER": {
        "codigo": "CATEGORIA_GASTO_VER",
        "nombre": "Ver Categorías de Gasto",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite visualizar las categorías de gasto disponibles."
    },
    "CATEGORIA_GASTO_CREAR": {
        "codigo": "CATEGORIA_GASTO_CREAR",
        "nombre": "Crear Categorías de Gasto",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite crear nuevas categorías de gasto."
    },
    "CATEGORIA_GASTO_EDITAR": {
        "codigo": "CATEGORIA_GASTO_EDITAR",
        "nombre": "Editar Categorías de Gasto",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite modificar categorías de gasto existentes."
    },
    "CATEGORIA_GASTO_ELIMINAR": {
        "codigo": "CATEGORIA_GASTO_ELIMINAR",
        "nombre": "Eliminar Categorías de Gasto",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite eliminar categorías de gasto."
    },
    # PAGOS
    "PAGO_GASTO_VER": {
        "codigo": "PAGO_GASTO_VER",
        "nombre": "Ver Pagos de Gastos",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite visualizar los pagos registrados de gastos."
    },
    "PAGO_GASTO_CREAR": {
        "codigo": "PAGO_GASTO_CREAR",
        "nombre": "Crear Pagos de Gastos",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite registrar nuevos pagos de gastos."
    },
    "PAGO_GASTO_EDITAR": {
        "codigo": "PAGO_GASTO_EDITAR",
        "nombre": "Editar Pagos de Gastos",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite editar pagos de gastos existentes."
    },
    "PAGO_GASTO_ELIMINAR": {
        "codigo": "PAGO_GASTO_ELIMINAR",
        "nombre": "Eliminar Pagos de Gastos",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite eliminar pagos de gastos."
    },
}
