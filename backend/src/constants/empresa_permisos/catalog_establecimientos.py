from .base import ModuloPermisos

ESTABLECIMIENTO_PERMS = {
    # MÓDULO: ESTABLECIMIENTOS Y PUNTOS DE EMISIÓN (Granulares)
    "ESTABLECIMIENTO_VER": {
        "codigo": "ESTABLECIMIENTO_VER",
        "nombre": "Ver Establecimientos",
        "modulo": ModuloPermisos.ESTABLECIMIENTOS,
        "descripcion": "Permite visualizar los establecimientos de la empresa."
    },
    "ESTABLECIMIENTO_GESTIONAR": {
        "codigo": "ESTABLECIMIENTO_GESTIONAR",
        "nombre": "Gestionar Establecimientos",
        "modulo": ModuloPermisos.ESTABLECIMIENTOS,
        "descripcion": "Permite crear, editar y eliminar establecimientos."
    },
    "PUNTO_EMISION_VER": {
        "codigo": "PUNTO_EMISION_VER",
        "nombre": "Ver Puntos de Emisión",
        "modulo": ModuloPermisos.ESTABLECIMIENTOS,
        "descripcion": "Permite visualizar los puntos de emisión."
    },
    "PUNTO_EMISION_GESTIONAR": {
        "codigo": "PUNTO_EMISION_GESTIONAR",
        "nombre": "Gestionar Puntos de Emisión",
        "modulo": ModuloPermisos.ESTABLECIMIENTOS,
        "descripcion": "Permite crear, editar y eliminar puntos de emisión."
    },
}
