from .base import ModuloPermisos

REPORTES_PERMS = {
    # MÓDULO: REPORTES
    "REPORTES_VER": {
        "codigo": "REPORTES_VER",
        "nombre": "Ver Reportes",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite acceder al panel de reportes."
    },
    "REPORTES_EXPORTAR": {
        "codigo": "REPORTES_EXPORTAR",
        "nombre": "Exportar Reportes",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite exportar datos de reportes."
    },
    # MÓDULO: REPORTES GENERADOS
    "REPORTE_GENERADO_VER": {
        "codigo": "REPORTE_GENERADO_VER",
        "nombre": "Ver Reportes Generados",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite visualizar y descargar los reportes históricos generados."
    },
    "REPORTE_GENERADO_ELIMINAR": {
        "codigo": "REPORTE_GENERADO_ELIMINAR",
        "nombre": "Eliminar Reportes Generados",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite eliminar reportes históricos del sistema."
    },
    # GRANULARIDAD POR ÁREA
    "REPORTE_FINANCIERO_VER": {
        "codigo": "REPORTE_FINANCIERO_VER",
        "nombre": "Acceso Reportes Financieros",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite ver reportes de balances, cuentas y estados financieros."
    },
    "REPORTE_VENTAS_VER": {
        "codigo": "REPORTE_VENTAS_VER",
        "nombre": "Acceso Reportes de Ventas",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite ver reportes de ventas, productos más vendidos y rendimiento de vendedores."
    },
    "REPORTE_INVENTARIO_VER": {
        "codigo": "REPORTE_INVENTARIO_VER",
        "nombre": "Acceso Reportes de Inventario",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite ver reportes de stock, kardex y movimientos de almacén."
    },
}
