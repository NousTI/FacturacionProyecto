from uuid import UUID
from ....constants.enums import AuthKeys
from ....errors.app_error import AppError
from . import ServicioFacturaCore

class ValidacionesFactura:
    @staticmethod
    def validar_acceso_factura(factura: dict, usuario_actual: dict):
        """Valida que el usuario tenga permiso para ver/operar la factura."""
        from ....constants.permissions import PermissionCodes
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if is_superadmin: return

        if str(factura.get('empresa_id')) != str(usuario_actual.get("empresa_id")):
            raise AppError("No tiene permiso para esta factura", 403, "AUTH_FORBIDDEN")

        permisos = usuario_actual.get("permisos", [])
        if PermissionCodes.FACTURAS_VER_TODAS in permisos:
             return
             
        if PermissionCodes.FACTURAS_VER_PROPIAS in permisos:
             if str(factura.get('usuario_id')) == str(usuario_actual.get('usuario_facturacion_id')):
                  return
             raise AppError("No tienes permiso para ver facturas de otros usuarios", 403, "AUTH_FORBIDDEN")

        raise AppError("No tienes permisos suficientes para acceder a esta factura", 403, "AUTH_FORBIDDEN")

    @staticmethod
    def validar_estado_borrador(factura: dict):
        if factura.get('estado') != 'BORRADOR':
            raise AppError("Solo facturas en BORRADOR pueden modificarse", 400, "VAL_ERROR")

    @staticmethod
    def obtener_y_validar_factura(core: ServicioFacturaCore, id: UUID, usuario_actual: dict):
        factura = core.obtener_factura(id)
        ValidacionesFactura.validar_acceso_factura(factura, usuario_actual)
        return factura
