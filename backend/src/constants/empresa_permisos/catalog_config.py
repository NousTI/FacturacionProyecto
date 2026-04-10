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
    # --- USUARIOS DE EMPRESA ---
    "USUARIOS_EMPRESA_VER": {
        "codigo": "USUARIOS_EMPRESA_VER",
        "nombre": "Ver Usuarios de Empresa",
        "modulo": ModuloPermisos.USUARIOS_EMPRESA,
        "descripcion": "Permite visualizar el listado de usuarios de la empresa."
    },
    "USUARIOS_EMPRESA_CREAR": {
        "codigo": "USUARIOS_EMPRESA_CREAR",
        "nombre": "Crear Usuarios de Empresa",
        "modulo": ModuloPermisos.USUARIOS_EMPRESA,
        "descripcion": "Permite registrar nuevos usuarios para la empresa."
    },
    "USUARIOS_EMPRESA_EDITAR": {
        "codigo": "USUARIOS_EMPRESA_EDITAR",
        "nombre": "Editar Usuarios de Empresa",
        "modulo": ModuloPermisos.USUARIOS_EMPRESA,
        "descripcion": "Permite modificar datos de usuarios existentes."
    },
    "USUARIOS_EMPRESA_ELIMINAR": {
        "codigo": "USUARIOS_EMPRESA_ELIMINAR",
        "nombre": "Eliminar Usuarios de Empresa",
        "modulo": ModuloPermisos.USUARIOS_EMPRESA,
        "descripcion": "Permite desactivar o eliminar usuarios."
    },
    # --- ROLES ---
    "ROLES_VER": {
        "codigo": "ROLES_VER",
        "nombre": "Ver Roles",
        "modulo": ModuloPermisos.ROLES,
        "descripcion": "Permite visualizar los roles configurados."
    },
    "ROLES_CREAR": {
        "codigo": "ROLES_CREAR",
        "nombre": "Crear Roles",
        "modulo": ModuloPermisos.ROLES,
        "descripcion": "Permite crear nuevos roles de usuario."
    },
    "ROLES_EDITAR": {
        "codigo": "ROLES_EDITAR",
        "nombre": "Editar Roles",
        "modulo": ModuloPermisos.ROLES,
        "descripcion": "Permite modificar permisos y nombres de roles existentes."
    },
    "ROLES_ELIMINAR": {
        "codigo": "ROLES_ELIMINAR",
        "nombre": "Eliminar Roles",
        "modulo": ModuloPermisos.ROLES,
        "descripcion": "Permite eliminar roles que no estén en uso."
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
    # MÓDULO: ESTABLECIMIENTOS Y PUNTOS DE EMISIÓN (Granulares)
    "ESTABLECIMIENTO_VER": {
        "codigo": "ESTABLECIMIENTO_VER",
        "nombre": "Ver Establecimientos",
        "modulo": ModuloPermisos.ESTABLECIMIENTOS,
        "descripcion": "Permite visualizar los establecimientos de la empresa."
    },
    "ESTABLECIMIENTO_CREAR": {
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
    "PUNTO_EMISION_CREAR": {
        "codigo": "PUNTO_EMISION_GESTIONAR",
        "nombre": "Gestionar Puntos de Emisión",
        "modulo": ModuloPermisos.ESTABLECIMIENTOS,
        "descripcion": "Permite crear, editar y eliminar puntos de emisión."
    },
}
