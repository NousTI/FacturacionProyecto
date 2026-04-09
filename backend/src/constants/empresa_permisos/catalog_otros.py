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
    "SUSCRIPCIONES_GESTIONAR": {
        "codigo": "SUSCRIPCIONES_GESTIONAR",
        "nombre": "Gestionar Suscripciones",
        "modulo": ModuloPermisos.SUSCRIPCIONES,
        "descripcion": "Permite activar, cancelar y renovar suscripciones, así como gestionar planes."
    },
    # MÓDULO: COMISIONES
    "COMISIONES_VER": {
        "codigo": "COMISIONES_VER",
        "nombre": "Ver Comisiones",
        "modulo": ModuloPermisos.COMISIONES,
        "descripcion": "Permite visualizar el listado y reportes de comisiones."
    },
    "COMISIONES_GESTIONAR": {
        "codigo": "COMISIONES_GESTIONAR",
        "nombre": "Gestionar Comisiones",
        "modulo": ModuloPermisos.COMISIONES,
        "descripcion": "Permite crear, editar y procesar comisiones de vendedores."
    },
    # MÓDULO: NOTIFICACIONES (Adicionales)
    "NOTIFICACION_LISTAR": {
        "codigo": "NOTIFICACION_LISTAR",
        "nombre": "Listar Notificaciones",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite ver las notificaciones del sistema."
    },
    "NOTIFICACION_LEER": {
        "codigo": "NOTIFICACION_LEER",
        "nombre": "Marcar Notificaciones como Leídas",
        "modulo": ModuloPermisos.CONFIGURACION,
        "descripcion": "Permite marcar notificaciones como leídas."
    },
    # CUENTAS POR COBRAR
    "CUENTA_COBRAR_VER": {
        "codigo": "CUENTA_COBRAR_VER",
        "nombre": "Ver Cuentas por Cobrar",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite visualizar el estado de cuentas por cobrar."
    },
    "CUENTA_COBRAR_CREAR": {
        "codigo": "CUENTA_COBRAR_CREAR",
        "nombre": "Crear Cuentas por Cobrar",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite registrar cobros y nuevas cuentas por cobrar."
    },
    "CUENTA_COBRAR_EDITAR": {
        "codigo": "CUENTA_COBRAR_EDITAR",
        "nombre": "Editar Cuentas por Cobrar",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite modificar cuentas por cobrar existentes."
    },
    "CUENTA_COBRAR_ELIMINAR": {
        "codigo": "CUENTA_COBRAR_ELIMINAR",
        "nombre": "Eliminar Cuentas por Cobrar",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite eliminar registros de cuentas por cobrar."
    },
    # CUENTAS POR PAGAR
    "CUENTA_PAGAR_VER": {
        "codigo": "CUENTA_PAGAR_VER",
        "nombre": "Ver Cuentas por Pagar",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite visualizar el estado de cuentas por pagar."
    },
    "CUENTA_PAGAR_CREAR": {
        "codigo": "CUENTA_PAGAR_CREAR",
        "nombre": "Crear Cuentas por Pagar",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite registrar pagos y nuevas cuentas por pagar."
    },
    "CUENTA_PAGAR_EDITAR": {
        "codigo": "CUENTA_PAGAR_EDITAR",
        "nombre": "Editar Cuentas por Pagar",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite modificar cuentas por pagar existentes."
    },
    "CUENTA_PAGAR_ELIMINAR": {
        "codigo": "CUENTA_PAGAR_ELIMINAR",
        "nombre": "Eliminar Cuentas por Pagar",
        "modulo": ModuloPermisos.REPORTES,
        "descripcion": "Permite eliminar registros de cuentas por pagar."
    },
}
