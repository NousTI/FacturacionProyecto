from .base import ModuloPermisos

REPORTES_PERMS = {
    # MÓDULO: REPORTES
    "REPORTES_VER": {
        "codigo": "REPORTES_VER",
        "nombre": "Ver Reportes",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite acceder al panel de reportes."
    },
    "REPORTES_GENERAR": {
        "codigo": "REPORTES_GENERAR",
        "nombre": "Generar Reportes",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite generar nuevos reportes."
    },
    "REPORTES_EXPORTAR": {
        "codigo": "REPORTES_EXPORTAR",
        "nombre": "Exportar Reportes",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite exportar datos de reportes."
    },
}
