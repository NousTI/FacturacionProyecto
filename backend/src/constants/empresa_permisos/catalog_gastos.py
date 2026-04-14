from .base import ModuloPermisos

GASTOS_PERMS = {
    "GESTIONAR_GASTOS": {
        "codigo": "GESTIONAR_GASTOS",
        "nombre": "Gestionar Gastos",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Control total sobre los movimientos y comprobantes de gastos."
    },
    "GESTIONAR_CATEGORIA_GASTO": {
        "codigo": "GESTIONAR_CATEGORIA_GASTO",
        "nombre": "Gestionar Categorías de Gasto",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite crear, editar y eliminar las categorías de clasificación de egresos."
    },
    "GESTIONAR_PAGOS": {
        "codigo": "GESTIONAR_PAGOS",
        "nombre": "Gestionar Pagos de Gastos",
        "modulo": ModuloPermisos.GASTOS,
        "descripcion": "Permite registrar y administrar el historial de pagos realizados a proveedores."
    },
}
