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
    "CONFIG_MODULOS": {
        "codigo": "CONFIG_MODULOS",
        "nombre": "Configurar Módulos Operativos",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite habilitar o deshabilitar módulos operativos de la empresa."
    },
    "MODULOS_GESTIONAR": {
        "codigo": "MODULOS_GESTIONAR",
        "nombre": "Gestionar Módulos y Funciones",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite habilitar o deshabilitar módulos operativos para la empresa."
    },
}
