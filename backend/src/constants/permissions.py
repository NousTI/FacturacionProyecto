from enum import Enum

class ModuloPermisos(str, Enum):
    CLIENTES = "CLIENTES"
    PRODUCTOS = "PRODUCTOS"
    FACTURAS = "FACTURAS"
    REPORTES = "REPORTES"
    CONFIGURACION = "CONFIGURACION"

class TipoPermiso(str, Enum):
    LECTURA = "LECTURA"
    ESCRITURA = "ESCRITURA"
    ELIMINACION = "ELIMINACION"
    ESPECIAL = "ESPECIAL"
    ADMIN = "ADMIN"

# Catálogo de Permisos Base
PERMISOS_BASE = {
    # MÓDULO: CLIENTES
    "CLIENTES_VER": {
        "codigo": "CLIENTES_VER",
        "nombre": "Ver Clientes",
        "modulo": ModuloPermisos.CLIENTES,
        "tipo": TipoPermiso.LECTURA,
        "descripcion": "Permite visualizar el listado y detalles de los clientes."
    },
    "CLIENTES_CREAR": {
        "codigo": "CLIENTES_CREAR",
        "nombre": "Crear Clientes",
        "modulo": ModuloPermisos.CLIENTES,
        "tipo": TipoPermiso.ESCRITURA,
        "descripcion": "Permite registrar nuevos clientes en el sistema."
    },
    "CLIENTES_EDITAR": {
        "codigo": "CLIENTES_EDITAR",
        "nombre": "Editar Clientes",
        "modulo": ModuloPermisos.CLIENTES,
        "tipo": TipoPermiso.ESCRITURA,
        "descripcion": "Permite modificar la información de clientes existentes."
    },
    "CLIENTES_ELIMINAR": {
        "codigo": "CLIENTES_ELIMINAR",
        "nombre": "Eliminar Clientes",
        "modulo": ModuloPermisos.CLIENTES,
        "tipo": TipoPermiso.ELIMINACION,
        "descripcion": "Permite dar de baja o eliminar clientes del sistema."
    },
    "CLIENTES_EXPORTAR": {
        "codigo": "CLIENTES_EXPORTAR",
        "nombre": "Exportar Clientes",
        "modulo": ModuloPermisos.CLIENTES,
        "tipo": TipoPermiso.ESPECIAL,
        "descripcion": "Permite exportar el listado de clientes a formatos externos (Excel, CSV)."
    },

    # MÓDULO: PRODUCTOS
    "PRODUCTOS_VER": {
        "codigo": "PRODUCTOS_VER",
        "nombre": "Ver Productos",
        "modulo": ModuloPermisos.PRODUCTOS,
        "tipo": TipoPermiso.LECTURA,
        "descripcion": "Permite visualizar el catálogo de productos."
    },
    "PRODUCTOS_CREAR": {
        "codigo": "PRODUCTOS_CREAR",
        "nombre": "Crear Productos",
        "modulo": ModuloPermisos.PRODUCTOS,
        "tipo": TipoPermiso.ESCRITURA,
        "descripcion": "Permite registrar nuevos productos."
    },
    "PRODUCTOS_EDITAR": {
        "codigo": "PRODUCTOS_EDITAR",
        "nombre": "Editar Productos",
        "modulo": ModuloPermisos.PRODUCTOS,
        "tipo": TipoPermiso.ESCRITURA,
        "descripcion": "Permite modificar productos existentes."
    },
    "PRODUCTOS_ELIMINAR": {
        "codigo": "PRODUCTOS_ELIMINAR",
        "nombre": "Eliminar Productos",
        "modulo": ModuloPermisos.PRODUCTOS,
        "tipo": TipoPermiso.ELIMINACION,
        "descripcion": "Permite eliminar productos."
    },
    "PRODUCTOS_VER_COSTOS": {
        "codigo": "PRODUCTOS_VER_COSTOS",
        "nombre": "Ver Costos de Productos",
        "modulo": ModuloPermisos.PRODUCTOS,
        "tipo": TipoPermiso.ESPECIAL,
        "descripcion": "Permite visualizar los costos y márgenes de ganancia de los productos."
    },

    # MÓDULO: FACTURAS
    "FACTURAS_VER_TODAS": {
        "codigo": "FACTURAS_VER_TODAS",
        "nombre": "Ver todas las facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "tipo": TipoPermiso.LECTURA,
        "descripcion": "Permite ver todas las facturas de la empresa."
    },
    "FACTURAS_VER_PROPIAS": {
        "codigo": "FACTURAS_VER_PROPIAS",
        "nombre": "Ver solo mis facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "tipo": TipoPermiso.LECTURA,
        "descripcion": "Permite ver únicamente las facturas creadas por el usuario actual."
    },
    "FACTURAS_CREAR": {
        "codigo": "FACTURAS_CREAR",
        "nombre": "Crear facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "tipo": TipoPermiso.ESCRITURA,
        "descripcion": "Permite emitir nuevas facturas."
    },
    "FACTURAS_EDITAR": {
        "codigo": "FACTURAS_EDITAR",
        "nombre": "Editar facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "tipo": TipoPermiso.ESCRITURA,
        "descripcion": "Permite editar facturas (antes de ser autorizadas)."
    },
    "FACTURAS_ANULAR": {
        "codigo": "FACTURAS_ANULAR",
        "nombre": "Anular facturas",
        "modulo": ModuloPermisos.FACTURAS,
        "tipo": TipoPermiso.ELIMINACION,
        "descripcion": "Permite anular facturas emitidas."
    },
    "FACTURAS_ENVIAR_SRI": {
        "codigo": "FACTURAS_ENVIAR_SRI",
        "nombre": "Enviar facturas al SRI",
        "modulo": ModuloPermisos.FACTURAS,
        "tipo": TipoPermiso.ESPECIAL,
        "descripcion": "Permite realizar el proceso de firma y envío al SRI."
    },
    "FACTURAS_DESCARGAR_PDF": {
        "codigo": "FACTURAS_DESCARGAR_PDF",
        "nombre": "Descargar facturas en PDF",
        "modulo": ModuloPermisos.FACTURAS,
        "tipo": TipoPermiso.LECTURA,
        "descripcion": "Permite visualizar y descargar el RIDE en PDF."
    },
    "FACTURAS_ENVIAR_EMAIL": {
        "codigo": "FACTURAS_ENVIAR_EMAIL",
        "nombre": "Enviar facturas por email",
        "modulo": ModuloPermisos.FACTURAS,
        "tipo": TipoPermiso.ESPECIAL,
        "descripcion": "Permite reenviar las facturas a los correos de los clientes."
    },

    # MÓDULO: REPORTES
    "REPORTES_VER": {
        "codigo": "REPORTES_VER",
        "nombre": "Ver Reportes",
        "modulo": ModuloPermisos.REPORTES,
        "tipo": TipoPermiso.LECTURA,
        "descripcion": "Permite acceder al panel de reportes."
    },
    "REPORTES_EXPORTAR": {
        "codigo": "REPORTES_EXPORTAR",
        "nombre": "Exportar Reportes",
        "modulo": ModuloPermisos.REPORTES,
        "tipo": TipoPermiso.ESPECIAL,
        "descripcion": "Permite exportar datos de reportes."
    },

    # MÓDULO: CONFIGURACIÓN
    "CONFIG_EMPRESA": {
        "codigo": "CONFIG_EMPRESA",
        "nombre": "Configurar datos de empresa",
        "modulo": ModuloPermisos.CONFIGURACION,
        "tipo": TipoPermiso.ADMIN,
        "descripcion": "Permite editar la información básica y comercial de la empresa."
    },
    "CONFIG_SRI": {
        "codigo": "CONFIG_SRI",
        "nombre": "Configurar datos del SRI",
        "modulo": ModuloPermisos.CONFIGURACION,
        "tipo": TipoPermiso.ADMIN,
        "descripcion": "Permite configurar firmas electrónicas y ambientes del SRI."
    },
    "CONFIG_USUARIOS": {
        "codigo": "CONFIG_USUARIOS",
        "nombre": "Gestionar usuarios",
        "modulo": ModuloPermisos.CONFIGURACION,
        "tipo": TipoPermiso.ADMIN,
        "descripcion": "Permite crear, editar y desactivar usuarios de la empresa."
    },
    "CONFIG_ROLES": {
        "codigo": "CONFIG_ROLES",
        "nombre": "Gestionar roles y permisos",
        "modulo": ModuloPermisos.CONFIGURACION,
        "tipo": TipoPermiso.ADMIN,
        "descripcion": "Permite definir roles y asignar permisos a los mismos."
    },
    "CONFIG_ESTABLECIMIENTOS": {
        "codigo": "CONFIG_ESTABLECIMIENTOS",
        "nombre": "Gestionar establecimiento",
        "modulo": ModuloPermisos.CONFIGURACION,
        "tipo": TipoPermiso.ADMIN,
        "descripcion": "Permite gestionar los puntos de emisión y establecimientos de la empresa."
    },
}

class PermissionCodes:
    # --- MÓDULO: CLIENTES ---
    CLIENTES_VER = "CLIENTES_VER"
    CLIENTES_CREAR = "CLIENTES_CREAR"
    CLIENTES_EDITAR = "CLIENTES_EDITAR"
    CLIENTES_ELIMINAR = "CLIENTES_ELIMINAR"
    CLIENTES_EXPORTAR = "CLIENTES_EXPORTAR"

    # --- MÓDULO: PRODUCTOS ---
    PRODUCTOS_VER = "PRODUCTOS_VER"
    PRODUCTOS_CREAR = "PRODUCTOS_CREAR"
    PRODUCTOS_EDITAR = "PRODUCTOS_EDITAR"
    PRODUCTOS_ELIMINAR = "PRODUCTOS_ELIMINAR"
    PRODUCTOS_VER_COSTOS = "PRODUCTOS_VER_COSTOS"
    
    # Compatibilidad (existente en el código)
    PRODUCTO_VER = "PRODUCTOS_VER"
    PRODUCTO_CREAR = "PRODUCTOS_CREAR"
    PRODUCTO_EDITAR = "PRODUCTOS_EDITAR"
    PRODUCTO_ELIMINAR = "PRODUCTOS_ELIMINAR"

    # --- MÓDULO: FACTURAS ---
    FACTURAS_VER_TODAS = "FACTURAS_VER_TODAS"
    FACTURAS_VER_PROPIAS = "FACTURAS_VER_PROPIAS"
    FACTURAS_CREAR = "FACTURAS_CREAR"
    FACTURAS_EDITAR = "FACTURAS_EDITAR"
    FACTURAS_ANULAR = "FACTURAS_ANULAR"
    FACTURAS_ENVIAR_SRI = "FACTURAS_ENVIAR_SRI"
    FACTURAS_DESCARGAR_PDF = "FACTURAS_DESCARGAR_PDF"
    FACTURAS_ENVIAR_EMAIL = "FACTURAS_ENVIAR_EMAIL"
    
    # Compatibilidad
    FACTURA_VER = "FACTURAS_VER_TODAS"
    FACTURA_CREAR = "FACTURAS_CREAR"
    FACTURA_EDITAR = "FACTURAS_EDITAR"
    FACTURA_ANULAR = "FACTURAS_ANULAR"
    FACTURA_ELIMINAR = "FACTURAS_ANULAR"
    FACTURA_ENVIAR_SRI = "FACTURAS_ENVIAR_SRI"

    # --- MÓDULO: REPORTES ---
    REPORTES_VER = "REPORTES_VER"
    REPORTES_EXPORTAR = "REPORTES_EXPORTAR"
    
    # Compatibilidad
    REPORTE_VER = "REPORTES_VER"
    REPORTE_EXPORTAR = "REPORTES_EXPORTAR"

    # --- MÓDULO: CONFIGURACIÓN ---
    CONFIG_EMPRESA = "CONFIG_EMPRESA"
    CONFIG_SRI = "CONFIG_SRI"
    CONFIG_USUARIOS = "CONFIG_USUARIOS"
    CONFIG_ROLES = "CONFIG_ROLES"
    CONFIG_ESTABLECIMIENTOS = "CONFIG_ESTABLECIMIENTOS"
    
    # Compatibilidad / Módulos específicos
    PERMISO_VER = "CONFIG_ROLES"
    CONFIG_EMPRESA_DETALLES = "CONFIG_EMPRESA"
    
    # Establecimientos
    ESTABLECIMIENTO_VER = "CONFIG_ESTABLECIMIENTOS"
    ESTABLECIMIENTO_CREAR = "CONFIG_ESTABLECIMIENTOS"
    ESTABLECIMIENTO_EDITAR = "CONFIG_ESTABLECIMIENTOS"
    ESTABLECIMIENTO_ELIMINAR = "CONFIG_ESTABLECIMIENTOS"
    
    # Puntos de Emisión
    PUNTO_EMISION_VER = "CONFIG_ESTABLECIMIENTOS"
    PUNTO_EMISION_CREAR = "CONFIG_ESTABLECIMIENTOS"
    PUNTO_EMISION_EDITAR = "CONFIG_ESTABLECIMIENTOS"
    PUNTO_EMISION_ELIMINAR = "CONFIG_ESTABLECIMIENTOS"
    
    # Otros módulos usados en código
    PROVEEDOR_VER = "PROVEEDOR_VER"
    PROVEEDOR_CREAR = "PROVEEDOR_CREAR"
    PROVEEDOR_EDITAR = "PROVEEDOR_EDITAR"
    PROVEEDOR_ELIMINAR = "PROVEEDOR_ELIMINAR"
    
    FACTURA_PROGRAMADA_VER = "FACTURA_PROGRAMADA_VER"
    FACTURA_PROGRAMADA_CREAR = "FACTURA_PROGRAMADA_CREAR"
    FACTURA_PROGRAMADA_EDITAR = "FACTURA_PROGRAMADA_EDITAR"
    FACTURA_PROGRAMADA_ELIMINAR = "FACTURA_PROGRAMADA_ELIMINAR"
    
    PAGO_VER = "PAGO_VER"
    PAGO_CREAR = "PAGO_CREAR"
    
    LOG_EMISION_VER = "LOG_EMISION_VER"

    # Cuentas por Cobrar
    CUENTA_COBRAR_VER = "CUENTA_COBRAR_VER"
    CUENTA_COBRAR_CREAR = "CUENTA_COBRAR_CREAR"
    CUENTA_COBRAR_EDITAR = "CUENTA_COBRAR_EDITAR"
    CUENTA_COBRAR_ELIMINAR = "CUENTA_COBRAR_ELIMINAR"
    CUENTA_COBRAR_ESTADISTICAS = "CUENTA_COBRAR_VER"

    # Cuentas por Pagar
    CUENTA_PAGAR_VER = "CUENTA_PAGAR_VER"
    CUENTA_PAGAR_CREAR = "CUENTA_PAGAR_CREAR"
    CUENTA_PAGAR_EDITAR = "CUENTA_PAGAR_EDITAR"
    CUENTA_PAGAR_ELIMINAR = "CUENTA_PAGAR_ELIMINAR"
    CUENTA_PAGAR_ESTADISTICAS = "CUENTA_PAGAR_VER"

    # Notificaciones
    NOTIFICACION_LISTAR = "NOTIFICACION_LISTAR"
    NOTIFICACION_LEER = "NOTIFICACION_LEER"
