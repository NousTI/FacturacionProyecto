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
        
        has_fact_todas = PermissionCodes.FACTURAS_VER_TODAS in permisos
        has_fact_propias = PermissionCodes.FACTURAS_VER_PROPIAS in permisos
        has_prog_todas = PermissionCodes.FACTURA_PROGRAMADA_VER in permisos
        has_prog_propias = PermissionCodes.FACTURA_PROGRAMADA_VER_PROPIAS in permisos

        is_owner = str(factura.get('usuario_id')) == str(usuario_actual.get('usuario_facturacion_id'))
        is_programada = factura.get('facturacion_programada_id') is not None or factura.get('origen') == 'FACTURACION_PROGRAMADA'

        # 1. Si posee la llave maestra de facturas normales
        if has_fact_todas:
            return

        # 2. Si puede ver sus propias facturas normales y es el dueño
        if has_fact_propias and is_owner:
            return
            
        # 3. Requisito estricto: Si falló en los permisos generales de factura, la única salvación es 
        # usar los permisos de la facturación programada. PERO el documento DEBE originarse desde allí.
        if not is_programada:
             raise AppError("No tienes permisos suficientes para acceder a facturas emitidas manualmente. Tu acceso se limita a Facturación Programada.", 403, "AUTH_FORBIDDEN")

        # 4. Evaluación final de las llaves del submódulo de programación (ya sabemos que es_programada=True)
        if has_prog_todas:
            return
            
        if has_prog_propias and is_owner:
            return
            
        raise AppError("No tienes permisos para ver esta factura. Fue originada por las suscripciones pero pertenece a otro usuario.", 403, "AUTH_FORBIDDEN")

    @staticmethod
    def validar_estado_borrador(factura: dict):
        if factura.get('estado') != 'BORRADOR':
            raise AppError("Solo facturas en BORRADOR pueden modificarse", 400, "VAL_ERROR")

    @staticmethod
    def obtener_y_validar_factura(core: ServicioFacturaCore, id: UUID, usuario_actual: dict):
        factura = core.obtener_factura(id)
        ValidacionesFactura.validar_acceso_factura(factura, usuario_actual)
        return factura
