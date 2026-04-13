from .base import ModuloPermisos

OTROS_PERMS = {
    # MÓDULO: DASHBOARDS
    "DASHBOARD_VER": {
        "codigo": "DASHBOARD_VER",
        "nombre": "Ver Dashboards",
        "modulo": ModuloPermisos.DASHBOARDS,
        "descripcion": "Permite visualizar los tableros de control e indicadores."
    },
    # CUENTAS POR COBRAR
    "CUENTA_COBRAR_VER": {
        "codigo": "CUENTA_COBRAR_VER",
        "nombre": "Ver Cuentas por Cobrar",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite visualizar el estado de cuentas por cobrar."
    },
}
