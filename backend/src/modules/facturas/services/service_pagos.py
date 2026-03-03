from uuid import UUID
from fastapi import Depends

from . import ServicioFacturaCore, ServicioPagosFactura
from ..schemas_logs import LogPagoCreacion
from .service_base import ValidacionesFactura

class ServicioPagos:
    def __init__(
        self, 
        core: ServicioFacturaCore = Depends(),
        pagos_factura: ServicioPagosFactura = Depends()
    ):
        self.core = core
        self.pagos_factura = pagos_factura

    def registrar_pago(self, datos: LogPagoCreacion, usuario_actual: dict):
        ValidacionesFactura.obtener_y_validar_factura(self.core, datos.factura_id, usuario_actual)
        usuario_id = UUID(str(usuario_actual.get("id")))
        return self.pagos_factura.registrar_pago(datos, usuario_id)

    def obtener_resumen_pagos(self, factura_id: UUID, usuario_actual: dict):
        ValidacionesFactura.obtener_y_validar_factura(self.core, factura_id, usuario_actual)
        return self.pagos_factura.obtener_resumen(factura_id)

    def listar_pagos(self, factura_id: UUID, usuario_actual: dict):
        ValidacionesFactura.obtener_y_validar_factura(self.core, factura_id, usuario_actual)
        return self.pagos_factura.listar_pagos(factura_id)
