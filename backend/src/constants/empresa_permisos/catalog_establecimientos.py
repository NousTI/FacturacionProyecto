from .base import ModuloPermisos

ESTABLECIMIENTO_PERMS = {
    # MÓDULO: ESTABLECIMIENTOS Y PUNTOS DE EMISIÓN (Consolidados)
    "ESTABLECIMIENTO_GESTIONAR": {
        "codigo": "ESTABLECIMIENTO_GESTIONAR",
        "nombre": "Gestionar Establecimientos",
        "modulo": ModuloPermisos.ESTABLECIMIENTOS,
        "descripcion": "Permite visualizar, crear, editar y eliminar los establecimientos de la empresa."
    },
    "PUNTO_EMISION_GESTIONAR": {
        "codigo": "PUNTO_EMISION_GESTIONAR",
        "nombre": "Gestionar Puntos de Emisión",
        "modulo": ModuloPermisos.ESTABLECIMIENTOS,
        "descripcion": "Permite visualizar, crear, editar y eliminar los puntos de emisión."
    },
}
