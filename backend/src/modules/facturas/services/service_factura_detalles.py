from uuid import UUID
from fastapi import Depends

from . import ServicioFacturaCore
from ....errors.app_error import AppError
from .service_base import ValidacionesFactura
from ...usuarios.repositories import RepositorioUsuarios
from ....constants.enums import AuthKeys

class ServicioFacturaDetalles:
    def __init__(
        self, 
        core: ServicioFacturaCore = Depends(),
        usuario_repo: RepositorioUsuarios = Depends()
    ):
        self.core = core
        self.usuario_repo = usuario_repo

    def _preparar_usuario(self, usuario_actual: dict):
        """Asegura que el usuario tenga el usuario_facturacion_id para las validaciones."""
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            u_fact = self.usuario_repo.obtener_por_user_id(usuario_actual['id'])
            if u_fact:
                usuario_actual['usuario_facturacion_id'] = u_fact['id']
        return usuario_actual

    def listar_detalles(self, factura_id: UUID, usuario_actual: dict):
        usuario_actual = self._preparar_usuario(usuario_actual)
        ValidacionesFactura.obtener_y_validar_factura(self.core, factura_id, usuario_actual)
        return self.core.repo.listar_detalles(factura_id)

    def agregar_detalle(self, datos_dict: dict, usuario_actual: dict):
        usuario_actual = self._preparar_usuario(usuario_actual)
        factura = ValidacionesFactura.obtener_y_validar_factura(self.core, datos_dict['factura_id'], usuario_actual)
        ValidacionesFactura.validar_estado_borrador(factura)
        
        if datos_dict.get('subtotal') is None or datos_dict.get('valor_iva') is None:
            cantidad = float(datos_dict.get('cantidad', 0))
            precio_unitario = float(datos_dict.get('precio_unitario', 0))
            descuento = float(datos_dict.get('descuento', 0))
            tipo_iva = datos_dict.get('tipo_iva', '0')
            
            subtotal = (cantidad * precio_unitario) - descuento
            datos_dict['subtotal'] = round(subtotal, 2)
            
            tarifas_iva = {
                '0': 0.00,
                '2': 0.12,
                '3': 0.14,
                '4': 0.15
            }
            tasa_iva = tarifas_iva.get(tipo_iva, 0.00)
            valor_iva = subtotal * tasa_iva
            datos_dict['valor_iva'] = round(valor_iva, 2)
        
        detalle = self.core.repo.crear_detalle(datos_dict)
        self.core.recalcular_totales(datos_dict['factura_id'])
        return detalle

    def actualizar_detalle(self, id: UUID, datos_dict: dict, usuario_actual: dict):
        usuario_actual = self._preparar_usuario(usuario_actual)
        detalle = self.core.repo.obtener_detalle(id)
        if not detalle: raise AppError("Detalle no encontrado", 404)
        factura = ValidacionesFactura.obtener_y_validar_factura(self.core, detalle['factura_id'], usuario_actual)
        ValidacionesFactura.validar_estado_borrador(factura)
        res = self.core.repo.actualizar_detalle(id, datos_dict)
        self.core.recalcular_totales(detalle['factura_id'])
        return res

    def eliminar_detalle(self, id: UUID, usuario_actual: dict):
        usuario_actual = self._preparar_usuario(usuario_actual)
        detalle = self.core.repo.obtener_detalle(id)
        if not detalle: raise AppError("Detalle no encontrado", 404)
        factura_id = detalle['factura_id']
        factura = ValidacionesFactura.obtener_y_validar_factura(self.core, factura_id, usuario_actual)
        ValidacionesFactura.validar_estado_borrador(factura)
        res = self.core.repo.eliminar_detalle(id)
        self.core.recalcular_totales(factura_id)
        return res
