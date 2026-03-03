from uuid import UUID
from ....constants.enums import AuthKeys
from ....errors.app_error import AppError
from . import ServicioFacturaCore

class ValidacionesFactura:
    @staticmethod
    def validar_acceso_factura(factura: dict, usuario_actual: dict):
        """Valida que el usuario tenga permiso para ver/operar la factura."""
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            if str(factura.get('empresa_id')) != str(usuario_actual.get("empresa_id")):
                raise AppError("No tiene permiso para esta factura", 403, "AUTH_FORBIDDEN")

    @staticmethod
    def validar_estado_borrador(factura: dict):
        if factura.get('estado') != 'BORRADOR':
            raise AppError("Solo facturas en BORRADOR pueden modificarse", 400, "VAL_ERROR")

    @staticmethod
    def obtener_y_validar_factura(core: ServicioFacturaCore, id: UUID, usuario_actual: dict):
        factura = core.obtener_factura(id)
        ValidacionesFactura.validar_acceso_factura(factura, usuario_actual)
        return factura
