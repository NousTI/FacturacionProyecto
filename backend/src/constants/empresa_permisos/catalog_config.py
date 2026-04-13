from .base import ModuloPermisos

CONFIG_PERMS = {
    # MÓDULO: CONFIGURACIÓN
    "CONFIG_EMPRESA": {
        "codigo": "CONFIG_EMPRESA",
        "nombre": "Configurar datos de empresa",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite editar la información básica y comercial de la empresa."
    },
    "CONFIG_SRI": {
        "codigo": "CONFIG_SRI",
        "nombre": "Configurar datos del SRI",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite configurar firmas electrónicas y ambientes del SRI."
    },
}
