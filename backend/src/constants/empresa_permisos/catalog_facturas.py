from .base import ModuloPermisos

FACTURAS_PERMS = {
    # MÓDULO: FACTURAS
    "FACTURAS_VER_TODAS": {
        "codigo": "FACTURAS_VER_TODAS",
        "nombre": "Ver todas las facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite ver todas las facturas de la empresa."
    },
    "FACTURAS_VER_PROPIAS": {
        "codigo": "FACTURAS_VER_PROPIAS",
        "nombre": "Ver solo mis facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite ver únicamente las facturas creadas por el usuario actual."
    },
    "FACTURAS_CREAR": {
        "codigo": "FACTURAS_CREAR",
        "nombre": "Crear facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite emitir nuevas facturas."
    },
    "FACTURAS_EDITAR": {
        "codigo": "FACTURAS_EDITAR",
        "nombre": "Editar facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite editar facturas (antes de ser autorizadas)."
    },
    "FACTURAS_ANULAR": {
        "codigo": "FACTURAS_ANULAR",
        "nombre": "Anular facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite anular facturas emitidas."
    },
    "FACTURAS_ENVIAR_SRI": {
        "codigo": "FACTURAS_ENVIAR_SRI",
        "nombre": "Enviar facturas al SRI",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite realizar el proceso de firma y envío al SRI."
    },
    "FACTURAS_DESCARGAR_PDF": {
        "codigo": "FACTURAS_DESCARGAR_PDF",
        "nombre": "Descargar facturas en PDF",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite visualizar y descargar el RIDE en PDF."
    },
    "FACTURAS_ENVIAR_EMAIL": {
        "codigo": "FACTURAS_ENVIAR_EMAIL",
        "nombre": "Enviar facturas por email",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite reenviar las facturas a los correos de los clientes."
    },
    # PAGOS DE FACTURAS
    "PAGO_FACTURA_VER": {
        "codigo": "PAGO_FACTURA_VER",
        "nombre": "Ver Pagos de Facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite visualizar los cobros y pagos de facturas de clientes."
    },
    "PAGO_FACTURA_CREAR": {
        "codigo": "PAGO_FACTURA_CREAR",
        "nombre": "Registrar Pagos de Facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite registrar cobros de facturas (cuentas por cobrar)."
    },
    "PAGO_FACTURA_EDITAR": {
        "codigo": "PAGO_FACTURA_EDITAR",
        "nombre": "Editar Pagos de Facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite modificar cobros de facturas registrados."
    },
    "PAGO_FACTURA_ELIMINAR": {
        "codigo": "PAGO_FACTURA_ELIMINAR",
        "nombre": "Eliminar Pagos de Facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite eliminar registros de cobros de facturas."
    },
    # FACTURACIÓN PROGRAMADA (RECURRENTE)
    "FACTURA_PROGRAMADA_VER": {
        "codigo": "FACTURA_PROGRAMADA_VER",
        "nombre": "Ver Facturación Programada",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite visualizar las reglas de facturación automática y recurrente."
    },
    "FACTURA_PROGRAMADA_VER_PROPIAS": {
        "codigo": "FACTURA_PROGRAMADA_VER_PROPIAS",
        "nombre": "Ver Facturaciones Programadas Propias",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite visualizar únicamente las reglas de facturación creadas por el usuario actual."
    },
    "FACTURA_PROGRAMADA_CREAR": {
        "codigo": "FACTURA_PROGRAMADA_CREAR",
        "nombre": "Crear Facturación Programada",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite configurar nuevas reglas de facturación automática."
    },
    "FACTURA_PROGRAMADA_EDITAR": {
        "codigo": "FACTURA_PROGRAMADA_EDITAR",
        "nombre": "Editar/Ejecutar Facturación Programada",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite modificar reglas existentes y ejecutar procesos de facturación pendiente manualmente."
    },
    "FACTURA_PROGRAMADA_ELIMINAR": {
        "codigo": "FACTURA_PROGRAMADA_ELIMINAR",
        "nombre": "Eliminar Facturación Programada",
        "modulo": ModuloPermisos.FACTURAS,
        "descripcion": "Permite eliminar configuraciones de facturación recurrente."
    },
}
