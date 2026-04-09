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
    "CONFIG_USUARIOS": {
        "codigo": "CONFIG_USUARIOS",
        "nombre": "Gestionar usuarios",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite crear, editar y desactivar usuarios de la empresa."
    },
    "CONFIG_ROLES": {
        "codigo": "CONFIG_ROLES",
        "nombre": "Gestionar roles y permisos (Admin)",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite definir roles y asignar permisos a los mismos."
    },
    "USUARIOS_VER": {
        "codigo": "USUARIOS_VER",
        "nombre": "Ver Usuarios",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite visualizar el listado de usuarios de la empresa."
    },
    "USUARIOS_GESTIONAR": {
        "codigo": "USUARIOS_GESTIONAR",
        "nombre": "Gestionar Usuarios",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite crear, editar, desactivar y resetear claves de usuarios."
    },
    "ROLES_GESTIONAR": {
        "codigo": "ROLES_GESTIONAR",
        "nombre": "Gestionar Roles y Permisos",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite crear roles y asignarles permisos específicos."
    },
    "MODULOS_GESTIONAR": {
        "codigo": "MODULOS_GESTIONAR",
        "nombre": "Gestionar Módulos y Funciones",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite habilitar o deshabilitar módulos operativos para la empresa."
    },
    "CONFIG_ESTABLECIMIENTOS": {
        "codigo": "CONFIG_ESTABLECIMIENTOS",
        "nombre": "Gestionar establecimiento (Legacy)",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite gestionar los puntos de emisión y establecimientos de la empresa."
    },
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
