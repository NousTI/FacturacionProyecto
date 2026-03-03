from uuid import UUID
from fastapi import Depends

from . import ServicioFacturaCore
from ....errors.app_error import AppError
from .service_base import ValidacionesFactura

class ServicioFacturaDetalles:
    def __init__(
        self, 
        core: ServicioFacturaCore = Depends()
    ):
        self.core = core

    def listar_detalles(self, factura_id: UUID, usuario_actual: dict):
        ValidacionesFactura.obtener_y_validar_factura(self.core, factura_id, usuario_actual)
        return self.core.repo.listar_detalles(factura_id)

    def agregar_detalle(self, datos_dict: dict, usuario_actual: dict):
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
        detalle = self.core.repo.obtener_detalle(id)
        if not detalle: raise AppError("Detalle no encontrado", 404)
        factura = ValidacionesFactura.obtener_y_validar_factura(self.core, detalle['factura_id'], usuario_actual)
        ValidacionesFactura.validar_estado_borrador(factura)
        res = self.core.repo.actualizar_detalle(id, datos_dict)
        self.core.recalcular_totales(detalle['factura_id'])
        return res

    def eliminar_detalle(self, id: UUID, usuario_actual: dict):
        detalle = self.core.repo.obtener_detalle(id)
        if not detalle: raise AppError("Detalle no encontrado", 404)
        factura_id = detalle['factura_id']
        factura = ValidacionesFactura.obtener_y_validar_factura(self.core, factura_id, usuario_actual)
        ValidacionesFactura.validar_estado_borrador(factura)
        res = self.core.repo.eliminar_detalle(id)
        self.core.recalcular_totales(factura_id)
        return res
