from uuid import UUID
from fastapi import Depends

from . import ServicioFacturaCore, ServicioPagosFactura
from ..schemas_logs import LogPagoCreacion
from .service_base import ValidacionesFactura
from ...usuarios.repositories import RepositorioUsuarios
from ....constants.enums import AuthKeys

class ServicioPagos:
    def __init__(
        self, 
        core: ServicioFacturaCore = Depends(),
        pagos_factura: ServicioPagosFactura = Depends(),
        usuario_repo: RepositorioUsuarios = Depends()
    ):
        self.core = core
        self.pagos_factura = pagos_factura
        self.usuario_repo = usuario_repo

    def _preparar_usuario(self, usuario_actual: dict):
        """Asegura que el usuario tenga el usuario_facturacion_id para las validaciones."""
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            u_fact = self.usuario_repo.obtener_por_user_id(usuario_actual['id'])
            if u_fact:
                usuario_actual['usuario_facturacion_id'] = u_fact['id']
        return usuario_actual

    def registrar_pago(self, datos: LogPagoCreacion, usuario_actual: dict):
        usuario_actual = self._preparar_usuario(usuario_actual)
        ValidacionesFactura.obtener_y_validar_factura(self.core, datos.factura_id, usuario_actual)
        
        # Corrección: usar el ID interno del módulo de facturación, no el AuthID global
        raw_id = usuario_actual.get('usuario_facturacion_id') or usuario_actual.get("id")
        usuario_id = UUID(str(raw_id))
        return self.pagos_factura.registrar_pago(datos, usuario_id)

    def obtener_resumen_pagos(self, factura_id: UUID, usuario_actual: dict):
        usuario_actual = self._preparar_usuario(usuario_actual)
        ValidacionesFactura.obtener_y_validar_factura(self.core, factura_id, usuario_actual)
        return self.pagos_factura.obtener_resumen(factura_id)

    def listar_pagos(self, factura_id: UUID, usuario_actual: dict):
        usuario_actual = self._preparar_usuario(usuario_actual)
        ValidacionesFactura.obtener_y_validar_factura(self.core, factura_id, usuario_actual)
        return self.pagos_factura.listar_pagos(factura_id)
