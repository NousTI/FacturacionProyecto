from .base import ModuloPermisos

OTROS_PERMS = {
    # MÓDULO: DASHBOARDS
    "DASHBOARD_VER": {
        "codigo": "DASHBOARD_VER",
        "nombre": "Ver Dashboards",
        "modulo": ModuloPermisos.DASHBOARDS,
        "descripcion": "Permite visualizar los tableros de control e indicadores."
    },
    # MÓDULO: SUSCRIPCIONES
    "SUSCRIPCIONES_VER": {
        "codigo": "SUSCRIPCIONES_VER",
        "nombre": "Ver Suscripciones",
        "modulo": ModuloPermisos.SUSCRIPCIONES,
        "descripcion": "Permite visualizar el estado de las suscripciones y planes."
    },
    # CUENTAS POR COBRAR
    "CUENTA_COBRAR_VER": {
        "codigo": "CUENTA_COBRAR_VER",
        "nombre": "Ver Cuentas por Cobrar",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite visualizar el estado de cuentas por cobrar."
    },
    "CUENTA_PAGAR_VER": {
        "codigo": "CUENTA_PAGAR_VER",
        "nombre": "Ver Cuentas por Pagar",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite visualizar el estado de cuentas por pagar."
    },
}
